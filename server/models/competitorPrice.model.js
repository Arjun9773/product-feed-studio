// models/competitorPrice.model.js

const mongoose = require('mongoose');

const competitorPriceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    // Your product identifier
    item_code: {
      type: String,
      required: true,
      index: true,
    },

    // Link to your products collection (optional)
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    // Competitor details
    competitor_name: {
      type: String,
      required: true,
      // e.g. "Flipkart", "Myntra", "Amazon"
    },

    competitor_sku: {
      type: String,
      default: null,
    },

    competitor_url: {
      type: String,
      default: null,
    },

    competitor_price: {
      type: Number,
      required: true,
    },

    // Original / MRP price on competitor site
    competitor_was_price: {
      type: Number,
      default: null,
    },

    // Your selling price (populated from products collection if available)
    your_price: {
      type: Number,
      default: null,
    },

    // Pre-computed diff fields (your_price - competitor_price)
    price_diff: {
      type: Number,
      default: null,
      // positive  → you're more expensive
      // negative  → you're cheaper
    },

    price_diff_pct: {
      type: Number,
      default: null,
      // percentage version of price_diff
    },

    // "expensive" | "cheaper" | "matched"
    status: {
      type: String,
      enum: ["expensive", "cheaper", "matched"],
      default: "matched",
      index: true,
    },

    // How this record was created
    source: {
      type: String,
      enum: ["manual", "scraper", "api", "feed"],
      default: "manual",
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },

    scraped_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,           // createdAt, updatedAt
    collection: "competitorprices",  // exact collection name from MongoDB
  }
);

// ── Compound indexes for common queries ──────────────────────
competitorPriceSchema.index({ tenantId: 1, status: 1 });
competitorPriceSchema.index({ tenantId: 1, competitor_name: 1 });
competitorPriceSchema.index({ tenantId: 1, item_code: 1, competitor_name: 1 });

const CompetitorPrice = mongoose.model("CompetitorPrice", competitorPriceSchema);
module.exports = { CompetitorPrice };
