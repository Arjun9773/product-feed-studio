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
  
         try {
       const { createGoogleAdsCampaign } = require("../services/googleAdsService");
       const googleCampaignId = await createGoogleAdsCampaign(
         req.tenantId,
         savedCampaign
       );
       await Campaign.findByIdAndUpdate(savedCampaign._id, {
         campaignId: googleCampaignId
      });
      savedCampaign.campaignId = googleCampaignId;
     } catch (adsError) {
       console.error("Google Ads create failed:", adsError.message);
      }
    res.status(201).json({ success: true, campaign: savedCampaign, message: "Campaign created successfully" });
  } catch (error) {
    console.error("Error creating campaign:", error.message);
    res.status(500).json({ error: "Failed to create campaign", message: error.message });
  }
});



router.get("/:id/analytics", tenantResolver, async (req, res) => {
  try {

    const Campaign = getCampaignModel(req.tenantDb);
    const campaign = await Campaign.findById(req.params.id);
 
        console.log("Campaign found:", campaign ? campaign.name : "NOT FOUND");
       console.log("DB name:", req.tenantDb.name);
       console.log("Analytics route hit!");
       console.log("Campaign ID:", req.params.id);
         console.log("Tenant ID:", req.tenantId);

         
    
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const { dateRange, startDate, endDate } = req.query;
    const { getCampaignAnalytics } = require("../services/googleAdsService");


    const analyticsData = await getCampaignAnalytics(
      req.tenantId,
      campaign.campaignId,
      { dateRange, startDate, endDate }
    );

    res.json({ success: true, data: analyticsData });
  } catch (error) {
    console.error("Analytics fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/:id", tenantResolver, async (req, res) => {
  try {
    const Campaign = getCampaignModel(req.tenantDb);
    const campaign = await Campaign.findById(req.params.id);
 
     

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error("Fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

module.exports = router;