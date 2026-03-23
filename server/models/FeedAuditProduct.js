// models/FeedAuditProduct.js
const mongoose = require('mongoose');

// ─── ISSUE SUB-SCHEMA ─────────────────────────────────────────
const IssueSchema = new mongoose.Schema(
  {
    field:    { type: String, required: true },
    label:    { type: String, required: true },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low', 'others'],
      required: true,
    },
    status: {
      type: String,
      enum: ['missing', 'issue'],
      required: true,
    },
  },
  { _id: false }
);

// ─── SUMMARY SUB-SCHEMA ───────────────────────────────────────
const SummarySchema = new mongoose.Schema(
  {
    high:   { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low:    { type: Number, default: 0 },
    others: { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── MAIN SCHEMA ─────────────────────────────────────────────
const FeedAuditProductSchema = new mongoose.Schema(
  {
    sourceId:     { type: String, required: true },
    product_name: { type: String, default: null },
    brand:        { type: String, default: null },
    category:     { type: String, default: null },

    // Audit results
    issues:  { type: [IssueSchema],  default: [] },
    score:   { type: Number, min: 0, max: 100, default: 0 },
    summary: { type: SummarySchema,  default: () => ({}) },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'feed_audit_products',
  }
);

// ─── INDEXES ─────────────────────────────────────────────────
FeedAuditProductSchema.index({ sourceId: 1 }, { unique: true });
FeedAuditProductSchema.index({ score: 1 });
FeedAuditProductSchema.index({ 'summary.high': 1 });

module.exports = FeedAuditProductSchema;
