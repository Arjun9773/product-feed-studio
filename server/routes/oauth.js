const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const GoogleOAuthToken = require("../models/GoogleOAuthToken");

const router = express.Router();

/**
 * Google OAuth Callback Route
 * Handles the authorization code from Google and exchanges it for access token
 * Stores tokens in the database linked to the user
 */
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Handle user denial
    if (error) {
      console.error("Google OAuth Error:", error);
      return res.redirect(
        `/?error=${encodeURIComponent(error || "Authentication failed")}`,
      );
    }

    if (!code) {
      return res.redirect("/?error=No authorization code received");
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`;

    console.log("[OAuth.callback] ===== OAuth Credentials =====");
    console.log(
      "[OAuth.callback] CLIENT_ID:",
      CLIENT_ID ? "✓ Set" : "✗ Missing",
    );
    console.log(
      "[OAuth.callback] CLIENT_SECRET:",
      CLIENT_SECRET ? "✓ Set" : "✗ Missing",
    );
    console.log("[OAuth.callback] REDIRECT_URI:", REDIRECT_URI);
    console.log("[OAuth.callback] =============================");

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials in environment");
      return res.redirect("/?error=Server configuration error");
    }

    // Exchange authorization code for access token
    console.log("[OAuth.callback] Exchanging authorization code for token...");
    const tokenResponse = await axios
      .post("https://oauth2.googleapis.com/token", {
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      })
      .catch((error) => {
        console.error(
          "[OAuth.callback] Token Exchange Error:",
          error.response?.data || error.message,
        );
        throw error;
      });

    const { access_token, refresh_token, expires_in, scope } =
      tokenResponse.data;

    console.log("[OAuth.callback] ✓ Token exchange successful");
    console.log(
      "[OAuth.callback] Access Token:",
      access_token ? "✓ Received" : "✗ Missing",
    );
    console.log(
      "[OAuth.callback] Refresh Token:",
      refresh_token ? "✓ Received" : "✗ Missing",
    );
    console.log("[OAuth.callback] Expires In:", expires_in, "seconds");

    // Fetch user profile information
    console.log("[OAuth.callback] Fetching user profile from Google...");
    const userResponse = await axios
      .get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      .catch((error) => {
        console.error(
          "[OAuth.callback] Profile Fetch Error:",
          error.response?.data || error.message,
        );
        throw error;
      });

    const { email, name, picture } = userResponse.data;

    // Find or create user in database
   const [stateUserId, stateCompanyId] = (state || "").split(":");
    console.log("[OAuth.callback] stateUserId:", stateUserId, "stateCompanyId:", stateCompanyId);

    let user = stateUserId ? await User.findOne({ userId: stateUserId }) : null;
    if (!user) user = await User.findOne({ email });
    console.log("[OAuth.callback] Found user:", user?._id, "userId:", user?.userId);

    if (!user) {
      user = new User({
        email,
        userName: name || email.split("@")[0],
        photoPath: picture || "",
        companyId: stateCompanyId || `company_${Date.now()}`,
        password: Math.random().toString(36).slice(-12),
      });
      await user.save();
      console.log(`[OAuth.callback] ✓ New user created: ${email}`);
    }

    // Create or update OAuth token by companyId
    let oauthToken = await GoogleOAuthToken.findOne({ companyId: stateCompanyId });

    if (!oauthToken) {
      console.log("[OAuth.callback] Creating new OAuth token record");
      oauthToken = new GoogleOAuthToken({
        userId: user._id,
        companyId: stateCompanyId,
        email,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        scope,
        name,
        picture,
        tokenType: "Bearer",
        isActive: true,
      });
    } else {
      console.log("[OAuth.callback] Updating existing OAuth token record");
      oauthToken.accessToken = access_token;
      oauthToken.refreshToken = refresh_token || oauthToken.refreshToken;
      oauthToken.expiresIn = expires_in;
      oauthToken.isActive = true;
      oauthToken.updatedAt = new Date();
    }

    console.log("[OAuth.callback] Saving OAuth token...");
    try {
      await oauthToken.save();
      console.log("[OAuth.callback] ✓ OAuth token saved successfully");
    } catch (saveError) {
      console.error("[OAuth.callback] ERROR saving OAuth token:", saveError);
      throw saveError;
    }

    // Update user with OAuth token reference and connection timestamp
    console.log("[OAuth.callback] Updating user with OAuth token reference...");
    user.googleOAuthToken = oauthToken._id;
    user.googleConnectedAt = new Date();
    try {
      await user.save();
      console.log("[OAuth.callback] ✓ User updated with OAuth token reference");
    } catch (saveError) {
      console.error("[OAuth.callback] ERROR updating user:", saveError);
      throw saveError;
    }

    // Store in session for current session
    req.session.googleAuth = {
      email,
      name,
      picture,
      userId: user._id,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      timestamp: Date.now(),
    };

    console.log(`✓ OAuth token stored in database for user: ${email}`);

    // Redirect back to campaign page with success
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = new URL(`${FRONTEND_URL}/campaign`);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error(
      "[OAuth.callback] ============ FULL ERROR DETAILS ============",
    );
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    if (error.response?.data) {
      console.error("Response Data:", error.response.data);
    }
    console.error("============================================");
    res.redirect(
      `/?error=${encodeURIComponent(error.message || "Authentication failed")}`,
    );
  }
});

/**
 * Get current Google Auth session
 */
router.get("/google/session", async (req, res) => {
  try {
    if (req.session?.googleAuth) {
      return res.json({
        authenticated: true,
        email: req.session.googleAuth.email,
        name: req.session.googleAuth.name,
        picture: req.session.googleAuth.picture,
        userId: req.session.googleAuth.userId,
      });
    }

    res.json({ authenticated: false });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

/**
 * Get stored Google OAuth token details for a user
 */
router.get("/google/token-info/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const oauthToken = await GoogleOAuthToken.findOne({ userId });

    if (!oauthToken) {
      return res.status(404).json({ error: "No OAuth token found" });
    }

    res.json({
      email: oauthToken.email,
      name: oauthToken.name,
      picture: oauthToken.picture,
      createdAt: oauthToken.createdAt,
      updatedAt: oauthToken.updatedAt,
      lastUsedAt: oauthToken.lastUsedAt,
      expiresAt: oauthToken.expiresAt,
      isExpired: oauthToken.isTokenExpired(),
      isActive: oauthToken.isActive,
      scope: oauthToken.scope,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token info" });
  }
});

/**
 * Check if a user has connected their Google account
 */
router.get("/google/connected/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const oauthToken = await GoogleOAuthToken.findOne({
      userId,
      isActive: true,
    });

    if (!oauthToken) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      email: oauthToken.email,
      connectedAt: oauthToken.createdAt,
      lastUpdated: oauthToken.updatedAt,
      isExpired: oauthToken.isTokenExpired(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check connection status" });
  }
});

/**
 * Logout / Disconnect Google OAuth
 */
router.post("/google/disconnect/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require("../models/User");

    // userId string → MongoDB _id find 
    const user = await User.findOne({ userId });
    if (!user) return res.json({ success: true });

    await GoogleOAuthToken.findOneAndUpdate(
      { userId: user._id },
      { isActive: false, updatedAt: new Date() }
    );

    req.session.googleAuth = null;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

/**
 * Logout (legacy endpoint)
 */
router.post("/google/logout", (req, res) => {
  try {
    req.session.googleAuth = null;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
});

module.exports = router;
