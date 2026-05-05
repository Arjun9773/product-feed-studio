const express = require("express");
const Campaign = require("../models/Campaign");

const router = express.Router();


router.get("/debug", async (req, res) => {
  const GoogleOAuthToken = require("../models/GoogleOAuthToken");
  const tokens = await GoogleOAuthToken.find({ isActive: true });
  res.json(tokens);
});
router.get("/drop-index", async (req, res) => {
  try {
    const GoogleOAuthToken = require("../models/GoogleOAuthToken");
    await GoogleOAuthToken.collection.dropIndex("userId_1");
    res.json({ success: true });
  } catch (error) {
    res.json({ error: error.message });
  }
});
 
router.get("/check-connection/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log("Checking companyId:", companyId);
    const GoogleOAuthToken = require("../models/GoogleOAuthToken");

    const oauthToken = await GoogleOAuthToken.findOne({
      companyId,
      isActive: true,
    });
    console.log("Token found:", oauthToken?.companyId, oauthToken?.isActive);

    if (!oauthToken) return res.json({ connected: false });

    res.json({
      connected: true,
      email: oauthToken.email,
      name: oauthToken.name,
      picture: oauthToken.picture,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to check connection" });
  }
});


// GET /api/campaigns/check-connection/:userId
router.get("/check-connection/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const GoogleOAuthToken = require("../models/GoogleOAuthToken");
    const User = require("../models/User");

    const user = await User.findOne({ userId });
    if (!user) return res.json({ connected: false });

    const oauthToken = await GoogleOAuthToken.findOne({
      companyId: user.companyId,
      isActive: true,
    });

    if (!oauthToken) return res.json({ connected: false });

    res.json({
      connected: true,
      email: oauthToken.email,
      name: oauthToken.name,
      picture: oauthToken.picture,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check connection" });
  }
});
// GET /api/campaigns/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

/**
 * GET /api/campaigns
 * Get all campaigns for a user
 */
router.get("/", async (req, res) => {
  try {
    const { userId, companyId, status } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (companyId) filter.companyId = companyId;
    if (status) filter.status = status;

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

/**
 * GET /api/campaigns/:campaignId
 * Get a single campaign by campaignId
 */
router.get("/:campaignId", async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      campaignId: req.params.campaignId,
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      objective,
      campaignType,
      merchantCenterId,
      merchantCenterName,
      budget,
      budgetType,
      biddingStrategy,
      networks,
      devices,
      locations,
      languages,
      schedule,
      priority,
      customerAcquisitionCost,
      adGroups,
      conversionGoals,
      companyId,
      userId,
      status,
      notes,
    } = req.body;

    // Validate required fields
    if (!name || !userId || !companyId) {
      return res.status(400).json({
        error: "Missing required fields: name, userId, companyId",
      });
    }

    // Create new campaign with all fields
    const campaign = new Campaign({
      name,
      objective: objective || "Sales",
      campaignType: campaignType || "Shopping",
      merchantCenterId,
      merchantCenterName,
      budget: parseFloat(budget) || 0,
      budgetType: budgetType || "daily",
      biddingStrategy: biddingStrategy || "Manual CPC",
      networks: Array.isArray(networks)
        ? networks
        : ["Google Search", "Google Shopping"],
      devices: Array.isArray(devices) ? devices : ["mobile", "desktop"],
      locations: Array.isArray(locations) ? locations : [],
      languages: Array.isArray(languages) ? languages : [],
      schedule: schedule || {},
      priority: typeof priority === "number" ? priority : 0,
      customerAcquisitionCost,
      adGroups: Array.isArray(adGroups) ? adGroups : [],
      conversionGoals: Array.isArray(conversionGoals) ? conversionGoals : [],
      companyId,
      userId,
      status: status || "draft",
      notes: notes || "",
    });

    // Save campaign to database
    const savedCampaign = await campaign.save();

    res.status(201).json({
      success: true,
      campaign: savedCampaign,
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.message,
      });
    }
    res.status(500).json({
      error: "Failed to create campaign",
      message: error.message,
    });
  }
});

/**
 * PUT /api/campaigns/:campaignId
 * Update a campaign
 */
router.put("/:campaignId", async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { campaignId: req.params.campaignId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

/**
 * PATCH /api/campaigns/:campaignId/status
 * Update campaign status only
 */
router.patch("/:campaignId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["draft", "active", "paused", "removed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const campaign = await Campaign.findOneAndUpdate(
      { campaignId: req.params.campaignId },
      { status, updatedAt: new Date() },
      { new: true },
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ error: "Failed to update campaign status" });
  }
});

/**
 * DELETE /api/campaigns/:campaignId
 * Soft delete — sets status to "removed"
 */
router.delete("/:campaignId", async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { campaignId: req.params.campaignId },
      { status: "removed", updatedAt: new Date() },
      { new: true },
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ success: true, message: "Campaign removed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

module.exports = router;
