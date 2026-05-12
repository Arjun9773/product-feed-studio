const express = require("express");
const tenantResolver = require('../middleware/tenantResolver');

const getCampaignModel = (db) => {
  if (db.models['Campaign']) {
    return db.models['Campaign'];
  }
  const CampaignBase = require('../models/Campaign');
  return db.model('Campaign', CampaignBase.schema, 'campaigns');
};

const router = express.Router();

router.get("/check-connection/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const GoogleOAuthToken = require("../models/GoogleOAuthToken");
    const oauthToken = await GoogleOAuthToken.findOne({ companyId, isActive: true });
    if (!oauthToken) return res.json({ connected: false });
    res.json({ connected: true, email: oauthToken.email, name: oauthToken.name, picture: oauthToken.picture });
  } catch (error) {
    res.status(500).json({ error: "Failed to check connection" });
  }
});

router.get("/user/:userId", tenantResolver, async (req, res) => {
  try {
    const Campaign = getCampaignModel(req.tenantDb);
    const campaigns = await Campaign.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error("Fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

router.post("/", tenantResolver, async (req, res) => {
  try {
    const {
      name, objective, campaignType, merchantCenterId, merchantCenterName,
      budget, budgetType, biddingStrategy, networks, devices, locations,
      languages, schedule, priority, customerAcquisitionCost, adGroups,
      conversionGoals, userId, status, notes,
    } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: "Missing required fields: name, userId" });
    }

    const Campaign = getCampaignModel(req.tenantDb);
    const campaign = new Campaign({
      name,
      objective: objective || "Sales",
      campaignType: campaignType || "Shopping",
      merchantCenterId,
      merchantCenterName,
      budget: parseFloat(budget) || 0,
      budgetType: budgetType || "daily",
      biddingStrategy: biddingStrategy || "Manual CPC",
      networks: Array.isArray(networks) ? networks : ["Google Search", "Google Shopping"],
      devices: Array.isArray(devices) ? devices : ["mobile", "desktop"],
      locations: Array.isArray(locations) ? locations : [],
      languages: Array.isArray(languages) ? languages : [],
      schedule: schedule || {},
      priority: typeof priority === "number" ? priority : 0,
      customerAcquisitionCost,
      adGroups: Array.isArray(adGroups) ? adGroups : [],
      conversionGoals: Array.isArray(conversionGoals) ? conversionGoals : [],
      companyId: req.tenantId,
      userId,
      status: status || "draft",
      notes: notes || "",
    });

    const savedCampaign = await campaign.save();
    res.status(201).json({ success: true, campaign: savedCampaign, message: "Campaign created successfully" });
  } catch (error) {
    console.error("Error creating campaign:", error.message);
    res.status(500).json({ error: "Failed to create campaign", message: error.message });
  }
});

module.exports = router;