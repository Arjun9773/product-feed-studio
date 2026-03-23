// models/AuditLog.js
const mongoose = require('mongoose');

const AuditSummarySchema = new mongoose.Schema(
  {
    high:   { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low:    { type: Number, default: 0 },
    others: { type: Number, default: 0 },
  },
  { _id: false }
);

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['feed_import', 'feed_import_error'],
      required: true,
    },
    feedId:   { type: String, required: true },
    feedName: { type: String, default: null },

    // Only for feed_import_error
    stage:        { type: String, default: null },   // 'fetch' | 'validate' | 'upsert' | 'unknown'
    errorMessage: { type: String, default: null },

    // Import counts
    totalProducts:     { type: Number, default: 0 },
    newProducts:       { type: Number, default: 0 },
    updatedProducts:   { type: Number, default: 0 },
    unchangedProducts: { type: Number, default: 0 },
    inactiveProducts:  { type: Number, default: 0 },
    enrichedProducts:  { type: Number, default: 0 }, // title-லிருந்து values filled
    skippedProducts:   { type: Number, default: 0 },

    // Audit issue counts
    auditSummary: { type: AuditSummarySchema, default: () => ({}) },

    importedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'audit',
  }
);

// Indexes
AuditLogSchema.index({ feedId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ importedAt: -1 });

module.exports = AuditLogSchema;
