/**
 * Campaign data service - Fetches real Google Ads and GA4 data
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Get campaign details from server using campaign ID
export async function getCampaign(campaignId, storeId, token) {
  try {
    const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "x-tenant-id": storeId,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    if (data.success) {
      return (
        data.data || {
          id: campaignId,
          name: "Campaign",
          status: "Active",
          type: "Shopping",
          budget: 1000,
        } 
      );
    }
    return {
      id: campaignId,
      name: "Campaign",
      status: "Active",
      type: "Shopping",
      budget: 1000,
    };
  } catch (error) {
    console.error("Error fetching campaign:", error);
    // Return fallback data
    return {
      id: campaignId,
      name: "Campaign",
      status: "Active",
      type: "Shopping",
      budget: 1000,
    };
  }
}

// Get analytics data from Google Ads and GA4
export async function getAnalytics(campaignId, dateRange, customRange, storeId, token) {
    console.log("getAnalytics storeId:", storeId); // ← add
  console.log("getAnalytics token:", token ? "exists" : "missing"); 
  try {
    const queryParams = new URLSearchParams({
      dateRange,
      ...(customRange && {
        startDate: customRange.from.toISOString().split("T")[0],
        endDate: customRange.to.toISOString().split("T")[0],
      }),
    });

    const response = await fetch(
      `${API_URL}/campaigns/${campaignId}/analytics?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "x-tenant-id": storeId,
          "Content-Type": "application/json",
        },
      },
    );
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    
   
    throw new Error(data.error || "Failed to fetch analytics");
    
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error; 
  }
}

// Mock data generator for fallback
// function getMockAnalytics(dateRange) {
//   const days = dateRange === "last7" ? 7 : dateRange === "last30" ? 30 : 90;
//   const trend = [];

//   for (let i = days; i > 0; i--) {
//     const date = new Date();
//     date.setDate(date.getDate() - i);
//     trend.push({
//       date: date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//       }),
//       impressions: Math.floor(Math.random() * 50000) + 10000,
//       clicks: Math.floor(Math.random() * 5000) + 1000,
//       conversions: Math.floor(Math.random() * 500) + 50,
//       revenue: Math.random() * 100000 + 10000,
//       sessions: Math.floor(Math.random() * 10000) + 2000,
//       users: Math.floor(Math.random() * 5000) + 1000,
//     });
//   }

//   return {
//     metrics: {
//       impressions: 250000,
//       clicks: 12500,
//       ctr: 0.05,
//       cpc: 1.2,
//       conversions: 625,
//       roas: 3.5,
//       spend: 15000,
//       revenue: 52500,
//       reach: 180000,
//       convRate: 0.05,
//       viewItem: 8500,
//       addToCart: 2100,
//       beginCheckout: 1200,
//       purchases: 625,
//       pageViews: 45000,
//       sessions: 28000,
//       users: 22000,
//       bounceRate: 0.35,
//       engagementRate: 0.68,
//     },
//     trend,
//     devices: [
//       { name: "Mobile", clicks: 6250 },
//       { name: "Desktop", clicks: 5000 },
//       { name: "Tablet", clicks: 1250 },
//     ],
//     keywords: [
//       {
//         keyword: "best product",
//         impressions: 25000,
//         clicks: 1250,
//         ctr: 0.05,
//         cpc: 1.2,
//         conversions: 65,
//       },
//       {
//         keyword: "buy online",
//         impressions: 20000,
//         clicks: 1000,
//         ctr: 0.05,
//         cpc: 1.15,
//         conversions: 50,
//       },
//       {
//         keyword: "quality items",
//         impressions: 15000,
//         clicks: 750,
//         ctr: 0.05,
//         cpc: 1.25,
//         conversions: 35,
//       },
//       {
//         keyword: "fast shipping",
//         impressions: 18000,
//         clicks: 900,
//         ctr: 0.05,
//         cpc: 1.1,
//         conversions: 45,
//       },
//       {
//         keyword: "discount deals",
//         impressions: 22000,
//         clicks: 1100,
//         ctr: 0.05,
//         cpc: 1.3,
//         conversions: 55,
//       },
//     ],
//     searchTerms: [
//       {
//         term: "where to buy",
//         impressions: 10000,
//         clicks: 500,
//         conversions: 30,
//       },
//       {
//         term: "product price",
//         impressions: 8000,
//         clicks: 400,
//         conversions: 20,
//       },
//       {
//         term: "free delivery",
//         impressions: 12000,
//         clicks: 600,
//         conversions: 35,
//       },
//       { term: "sale today", impressions: 9000, clicks: 450, conversions: 25 },
//     ],
//     adGroups: [
//       {
//         name: "Ad Group 1",
//         status: "Active",
//         clicks: 3125,
//         cpc: 1.2,
//         conversions: 160,
//       },
//       {
//         name: "Ad Group 2",
//         status: "Active",
//         clicks: 3125,
//         cpc: 1.22,
//         conversions: 155,
//       },
//       {
//         name: "Ad Group 3",
//         status: "Paused",
//         clicks: 1500,
//         cpc: 1.15,
//         conversions: 70,
//       },
//       {
//         name: "Ad Group 4",
//         status: "Active",
//         clicks: 2500,
//         cpc: 1.25,
//         conversions: 130,
//       },
//     ],
//     audiences: [
//       { name: "New visitors", users: 8000, convRate: 0.04, revenue: 15000 },
//       {
//         name: "Returning visitors",
//         users: 10000,
//         convRate: 0.08,
//         revenue: 25000,
//       },
//       { name: "Cart abandoners", users: 4000, convRate: 0.15, revenue: 12500 },
//     ],
//     trafficSources: [
//       { source: "Google Shopping", sessions: 12000 },
//       { source: "Google Search", sessions: 10000 },
//       { source: "Display Network", sessions: 6000 },
//     ],
//     products: [
//       {
//         sku: "SKU001",
//         name: "Product A",
//         views: 5000,
//         addToCart: 1200,
//         purchases: 250,
//         revenue: 15000,
//       },
//       {
//         sku: "SKU002",
//         name: "Product B",
//         views: 4000,
//         addToCart: 800,
//         purchases: 180,
//         revenue: 12000,
//       },
//       {
//         sku: "SKU003",
//         name: "Product C",
//         views: 3500,
//         addToCart: 700,
//         purchases: 120,
//         revenue: 10500,
//       },
//       {
//         sku: "SKU004",
//         name: "Product D",
//         views: 3000,
//         addToCart: 600,
//         purchases: 75,
//         revenue: 9000,
//       },
//     ],
//     activity: [
//       {
//         event: "Campaign started",
//         detail: "Campaign 'Best Products' went live",
//         time: "2 hours ago",
//       },
//       {
//         event: "Budget adjusted",
//         detail: "Daily budget increased to $100",
//         time: "5 hours ago",
//       },
//       {
//         event: "Ad paused",
//         detail: "Ad Group 3 was paused for optimization",
//         time: "1 day ago",
//       },
//       {
//         event: "New keywords added",
//         detail: "5 new keywords added to Ad Group 1",
//         time: "2 days ago",
//       },
//       {
//         event: "Bid adjustment",
//         detail: "Mobile bid adjusted to 120%",
//         time: "3 days ago",
//       },
//     ],
//   };
// }
