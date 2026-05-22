const mongoose = require("mongoose");
const Integration = require("./models/Integration");
require("dotenv").config();

const integrations = [
  { id: "campaign", name: "Google Campaign",   path: "/campaign", desc: "Manage your Google Ads campaigns",      category: "Ads"       },
  { id: "competitor-price",name: "Competitor Price",  path: "/competitor-price",desc: "Track competitor pricing automatically", category: "Analytics" },
  { id: "facebook-leads",  name: "Facebook Leads",    path: "/facebook-leads",  desc: "Capture and manage Facebook leads",     category: "Social"    },
  { id: "gmb",             name: "Google My Business",path: "/gmb",             desc: "Manage your local business listings",   category: "Local"     },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Integration.deleteMany({});
  await Integration.insertMany(integrations);
  console.log("✅ Integrations seeded!");
  process.exit(0);
});
