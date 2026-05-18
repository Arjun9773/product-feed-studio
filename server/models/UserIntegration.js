const mongoose = require("mongoose");

const userIntegrationSchema = new mongoose.Schema(
  {
    companyId:     { type: String, required: true }, // Company.js-ல் இருக்க companyId
    integrationId: { type: String, required: true }, // Integration.id
    connected:     { type: Boolean, default: false },
    connectedAt:   { type: Date },
    meta:          { type: mongoose.Schema.Types.Mixed, default: {} }, // extra config store பண்ண
  },
  { timestamps: true, collection: "user_integrations" }
);

// ஒரு company ஒரு integration-ஐ ஒரே ஒரு முறை மட்டும் store பண்ண
userIntegrationSchema.index({ companyId: 1, integrationId: 1 }, { unique: true });

module.exports = mongoose.model("UserIntegration", userIntegrationSchema);
