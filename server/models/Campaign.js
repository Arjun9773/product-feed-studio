const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    campaignId: { type: String, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: { type: String, required: true },

    // Campaign Basic Info
    name: { type: String, required: true },
    objective: { type: String, default: "Sales" }, // Sales, Leads, Traffic, etc.
    status: {
      type: String,
      enum: ["draft", "active", "paused", "removed"],
      default: "draft",
    },

    // Merchant & Shopping
    merchantCenterId: { type: String },
    merchantCenterName: { type: String },

    // Campaign Type
    campaignType: {
      type: String,
      enum: ["Shopping", "Search", "Display", "Video"],
      default: "Shopping",
    },

    // Budget & Bidding
    budget: { type: Number }, // Daily budget
    budgetType: { type: String, enum: ["daily", "lifetime"], default: "daily" },
    biddingStrategy: {
      type: String,
      enum: ["Manual CPC", "Automated Bidding"],
      default: "Manual CPC",
    },

    // Campaign Settings
    networks: {
      type: [String],
      default: ["Google Search", "Google Shopping", "Display Network"],
    },
    devices: { type: [String], default: ["mobile", "desktop", "tablet"] },
    locations: { type: [String], default: [] }, // Target locations
    languages: { type: [String], default: [] }, // Target languages
    schedule: {
      startDate: { type: Date },
      endDate: { type: Date },
      adSchedules: [
        {
          dayOfWeek: String,
          startTime: String,
          endTime: String,
          bidModifier: Number,
        },
      ],
    },

    // Campaign Priority & Settings
    priority: { type: Number, default: 0 }, // Low: 0, Medium: 1, High: 2
    customerAcquisitionCost: { type: Number }, // Target CAC

    // Ad Group
    adGroups: [
      {
        name: { type: String },
        defaultBid: { type: Number },
        productPartition: { type: String },
      },
    ],

    // Conversion Goals
    conversionGoals: { type: [String], default: [] },

    // Metadata
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
    lastModifiedBy: { type: String },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "campaigns" },
);

// Generate campaign ID before saving
campaignSchema.pre("save", function (next) {
  if (!this.campaignId) {
    this.campaignId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Campaign", campaignSchema);
