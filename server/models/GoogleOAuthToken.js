const mongoose = require("mongoose");

const googleOAuthTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      
    },
    companyId: { type: String, required: true }, 
    email: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresIn: { type: Number }, // Expiration time in seconds
    tokenType: { type: String, default: "Bearer" },
    scope: { type: String },
    name: { type: String },
    picture: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date }, // Calculated expiration timestamp
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "google_oauth_tokens" },
);

// Calculate expiresAt before saving
googleOAuthTokenSchema.pre("save", async function () {
  try {
    console.log(
      "[GoogleOAuthToken.pre.save] Starting pre-save hook for:",
      this.email,
    );
    if (this.expiresIn) {
      this.expiresAt = new Date(Date.now() + this.expiresIn * 1000);
      console.log(
        "[GoogleOAuthToken.pre.save] ✓ Calculated expiresAt:",
        this.expiresAt,
      );
    }
    this.updatedAt = Date.now();
  } catch (err) {
    console.error("[GoogleOAuthToken.pre.save] Error:", err);
    throw err;
  }
});

// Method to check if token is expired
googleOAuthTokenSchema.methods.isTokenExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to update last used timestamp
googleOAuthTokenSchema.methods.updateLastUsed = function () {
  this.lastUsedAt = Date.now();
  return this.save();
};

module.exports = mongoose.model("GoogleOAuthToken", googleOAuthTokenSchema);
