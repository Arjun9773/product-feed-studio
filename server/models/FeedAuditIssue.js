// models/FeedAuditIssue.js
const mongoose = require('mongoose');

const FeedAuditIssueSchema = new mongoose.Schema(
  {
    field:    { type: String, required: true, unique: true }, // e.g. 'color'
    label:    { type: String, required: true },               // e.g. 'No Colour'
    priority: { type: String, required: true, enum: ['high', 'medium', 'low', 'others'] },
    status:   { type: String, required: true, enum: ['missing', 'issue'], default: 'missing' },
    isActive: { type: Boolean, default: true },               // toggle off to disable a check
  },
  {
    collection: 'feed_audit_issue',
    timestamps: true,
  }
);

module.exports = mongoose.model('FeedAuditIssue', FeedAuditIssueSchema);
