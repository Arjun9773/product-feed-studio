const { GoogleAdsApi } = require("google-ads-api");
const GoogleOAuthToken = require("../models/GoogleOAuthToken");

const getClient = (refreshToken) => {
  return new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  }).Customer({
    customer_id: "", // dynamic-ஆ set ஆகும்
    refresh_token: refreshToken,
  });
};

// Customer ID fetch — OAuth token கிடைத்ததும் call பண்ணணும்
const fetchAndSaveCustomerId = async (companyId) => {
  try {
    const oauthToken = await GoogleOAuthToken.findOne({ 
      companyId, 
      isActive: true 
    });
    
    if (!oauthToken?.refreshToken) {
      throw new Error("No refresh token found");
    }

    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });

    // Accessible customers list fetch
    const accessibleCustomers = await client.listAccessibleCustomers(
      oauthToken.refreshToken
    );

    const customerId = accessibleCustomers.resource_names[0]
      .split("/")[1];

    // DB-ல் save
    await GoogleOAuthToken.findOneAndUpdate(
      { companyId, isActive: true },
      { googleAdsCustomerId: customerId }
    );

    return customerId;
  } catch (error) {
    console.error("fetchAndSaveCustomerId error:", error.message);
    throw error;
  }
};

// Google Ads-ல் Campaign Create
const createGoogleAdsCampaign = async (companyId, campaignData) => {
  try {
    const oauthToken = await GoogleOAuthToken.findOne({ 
      companyId, 
      isActive: true 
    });

    if (!oauthToken?.refreshToken) {
      throw new Error("No refresh token found");
    }

    // Customer ID இல்லாம இருந்தால் fetch பண்ணு
    let customerId = oauthToken.googleAdsCustomerId;
    if (!customerId) {
      customerId = await fetchAndSaveCustomerId(companyId);
    }

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: customerId,
  login_customer_id: process.env.GOOGLE_ADS_MANAGER_ID, 
  refresh_token: oauthToken.refreshToken,
});

    // Budget create
    const budgetResponse = await client.campaignBudgets.create([{
      name: `${campaignData.name}_budget_${Date.now()}`,
      amount_micros: (campaignData.budget || 100) * 1_000_000,
      delivery_method: "STANDARD",
    }]);

    const budgetResourceName = budgetResponse.results[0].resource_name;

    // Campaign create  
    const campaignResponse = await client.campaigns.create([{
      name: campaignData.name,
      status: "PAUSED",
      campaign_budget: budgetResourceName,
      advertising_channel_type: "SHOPPING",
      shopping_setting: {
        merchant_id: parseInt(campaignData.merchantCenterId) || 0,
        campaign_priority: campaignData.priority || 0,
        enable_local: false,
      },
      manual_cpc: {},
    }]);

    const googleCampaignId = campaignResponse.results[0]
      .resource_name.split("/")[3];

    return googleCampaignId;
  } catch (error) {
    console.error("createGoogleAdsCampaign error:", error.message);
      console.error("createGoogleAdsCampaign error FULL:", JSON.stringify(error, null, 2));
    console.error("createGoogleAdsCampaign message:", error.message);
    console.error("createGoogleAdsCampaign details:", error.details);
    console.error("createGoogleAdsCampaign status:", error.code);
    throw error;
  }
};
const getCampaignAnalytics = async (companyId, googleCampaignId, { dateRange, startDate, endDate }) => {
  try {
    const oauthToken = await GoogleOAuthToken.findOne({
      companyId,
      isActive: true
    });

    if (!oauthToken?.refreshToken) {
      throw new Error("No refresh token found");
    }

    let customerId = oauthToken.googleAdsCustomerId;
    if (!customerId) {
      customerId = await fetchAndSaveCustomerId(companyId);
    }

    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    }).Customer({
      customer_id: customerId,
      login_customer_id: process.env.GOOGLE_ADS_MANAGER_ID,
      refresh_token: oauthToken.refreshToken,
    });

    // Date range calculate
    const { fromDate, toDate } = getDateRange(dateRange, startDate, endDate);

    // Campaign metrics fetch
    const metricsQuery = await client.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_micros,
        metrics.search_impression_share
      FROM campaign
      WHERE campaign.id = ${googleCampaignId}
        AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
    `);

    // Daily trend fetch
    const trendQuery = await client.query(`
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_micros
      FROM campaign
      WHERE campaign.id = ${googleCampaignId}
        AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
      ORDER BY segments.date ASC
    `);

    // Device performance fetch
    const deviceQuery = await client.query(`
      SELECT
        segments.device,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions
      FROM campaign
      WHERE campaign.id = ${googleCampaignId}
        AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
    `);

    // Ad Groups fetch
    const adGroupQuery = await client.query(`
      SELECT
        ad_group.name,
        ad_group.status,
        metrics.clicks,
        metrics.average_cpc,
        metrics.conversions
      FROM ad_group
      WHERE campaign.id = ${googleCampaignId}
        AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
    `);

    // Search Terms fetch
    const searchTermQuery = await client.query(`
      SELECT
        search_term_view.search_term,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions
      FROM search_term_view
      WHERE campaign.id = ${googleCampaignId}
        AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
      LIMIT 10
    `);

    // Data format பண்ணு
    const metrics = metricsQuery[0] || {};
    const spend = (metrics.metrics?.cost_micros || 0) / 1_000_000;
    const revenue = metrics.metrics?.conversions_value || 0;

    return {
      metrics: {
        impressions: metrics.metrics?.impressions || 0,
        clicks: metrics.metrics?.clicks || 0,
        ctr: metrics.metrics?.ctr || 0,
        cpc: (metrics.metrics?.average_cpc || 0) / 1_000_000,
        conversions: metrics.metrics?.conversions || 0,
        roas: spend > 0 ? revenue / spend : 0,
        spend,
        revenue,
        reach: metrics.metrics?.impressions || 0,
        convRate: metrics.metrics?.clicks > 0
          ? (metrics.metrics?.conversions / metrics.metrics?.clicks)
          : 0,
        // GA4 data — later add பண்ணலாம்
        viewItem: 0,
        addToCart: 0,
        beginCheckout: 0,
        purchases: metrics.metrics?.conversions || 0,
        pageViews: 0,
        sessions: 0,
        users: 0,
        bounceRate: 0,
        engagementRate: 0,
      },
      trend: trendQuery.map(row => ({
        date: row.segments?.date,
        impressions: row.metrics?.impressions || 0,
        clicks: row.metrics?.clicks || 0,
        conversions: row.metrics?.conversions || 0,
        revenue: (row.metrics?.conversions_value || 0),
        sessions: 0,
        users: 0,
      })),
      devices: deviceQuery.map(row => ({
        name: row.segments?.device,
        clicks: row.metrics?.clicks || 0,
      })),
      adGroups: adGroupQuery.map(row => ({
        name: row.ad_group?.name,
        status: row.ad_group?.status === 2 ? "Active" : "Paused",
        clicks: row.metrics?.clicks || 0,
        cpc: (row.metrics?.average_cpc || 0) / 1_000_000,
        conversions: row.metrics?.conversions || 0,
      })),
      searchTerms: searchTermQuery.map(row => ({
        term: row.search_term_view?.search_term,
        impressions: row.metrics?.impressions || 0,
        clicks: row.metrics?.clicks || 0,
        conversions: row.metrics?.conversions || 0,
      })),
      keywords: [],
      audiences: [],
      trafficSources: [],
      products: [],
      activity: [],
    };
  } catch (error) {
    console.error("getCampaignAnalytics error:", error);
    throw error;
  }
};

// Date range helper
const getDateRange = (dateRange, startDate, endDate) => {
  const today = new Date();
  const toDate = today.toISOString().split("T")[0];

  if (dateRange === "last7") {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { fromDate: from.toISOString().split("T")[0], toDate };
  }
  if (dateRange === "last30") {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { fromDate: from.toISOString().split("T")[0], toDate };
  }
  if (dateRange === "last90") {
    const from = new Date();
    from.setDate(from.getDate() - 90);
    return { fromDate: from.toISOString().split("T")[0], toDate };
  }
  if (startDate && endDate) {
    return { fromDate: startDate, toDate: endDate };
  }
  // Default last 30 days
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { fromDate: from.toISOString().split("T")[0], toDate };
};

module.exports = { createGoogleAdsCampaign, fetchAndSaveCustomerId, getCampaignAnalytics  };