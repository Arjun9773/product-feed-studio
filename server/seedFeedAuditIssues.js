// scripts/seedFeedAuditIssues.js
//
// Run once manually:
//   node scripts/seedFeedAuditIssues.js
//
// This inserts all 32 issue definitions into feed_audit_issue.
// Uses updateOne + upsert so it's safe to re-run (no duplicates).

require('dotenv').config();
const mongoose = require('mongoose');
const FeedAuditIssue = require('./models/FeedAuditIssue');

const ISSUES = [
  // ── HIGH PRIORITY (7) ──────────────────────────────────────
  { field: 'color',           label: 'No Colour',           priority: 'high',   status: 'missing' },
  { field: 'age_group',       label: 'No Age Group',        priority: 'high',   status: 'missing' },
  { field: 'gender',          label: 'No Gender',           priority: 'high',   status: 'missing' },
  { field: 'material',        label: 'No Material',         priority: 'high',   status: 'missing' },
  { field: 'brand_in_title',  label: 'Brand not in title',  priority: 'high',   status: 'issue'   },
  { field: 'google_category', label: 'No Google Category',  priority: 'high',   status: 'missing' },
  { field: 'brand',           label: 'No Brand',            priority: 'high',   status: 'missing' },

  // ── MEDIUM PRIORITY (4) ────────────────────────────────────
  { field: 'pattern',         label: 'No Pattern',          priority: 'medium', status: 'missing' },
  { field: 'proper_casing',   label: 'Proper casing',       priority: 'medium', status: 'issue'   },
  { field: 'description',     label: 'No Description',      priority: 'medium', status: 'missing' },
  { field: 'short_description',label: 'No Short Description',priority: 'medium', status: 'missing' },

  // ── LOW PRIORITY (1) ───────────────────────────────────────
  { field: 'ean_id',          label: 'No GTIN',             priority: 'low',    status: 'missing' },

  // ── OTHERS PRIORITY (20) ───────────────────────────────────
  { field: 'url_key',            label: 'No Url Key',            priority: 'others', status: 'missing' },
  { field: 'meta_title',         label: 'No Meta Tittle',        priority: 'others', status: 'missing' },
  { field: 'bl_size',            label: 'No Bl Size',            priority: 'others', status: 'missing' },
  { field: 'quantity',           label: 'No Quantity',           priority: 'others', status: 'missing' },
  { field: 'was_price',          label: 'No Was Price',          priority: 'others', status: 'missing' },
  { field: 'sku_variation',      label: 'No Sku Variation',      priority: 'others', status: 'missing' },
  { field: 'bl_upc',             label: 'No Bl Upc',             priority: 'others', status: 'missing' },
  { field: 'product_highlight1', label: 'No Product Highlight1', priority: 'others', status: 'missing' },
  { field: 'product_highlight2', label: 'No Product Highlight2', priority: 'others', status: 'missing' },
  { field: 'product_highlight3', label: 'No Product Highlight3', priority: 'others', status: 'missing' },
  { field: 'product_highlight4', label: 'No Product Highlight4', priority: 'others', status: 'missing' },
  { field: 'product_highlight5', label: 'No Product Highlight5', priority: 'others', status: 'missing' },
  { field: 'additional_image1',  label: 'No Additional Image1',  priority: 'others', status: 'missing' },
  { field: 'additional_image2',  label: 'No Additional Image2',  priority: 'others', status: 'missing' },
  { field: 'additional_image3',  label: 'No Additional Image3',  priority: 'others', status: 'missing' },
  { field: 'additional_image4',  label: 'No Additional Image4',  priority: 'others', status: 'missing' },
  { field: 'additional_image5',  label: 'No Additional Image5',  priority: 'others', status: 'missing' },
  { field: 'additional_image6',  label: 'No Additional Image6',  priority: 'others', status: 'missing' },
  { field: 'additional_image7',  label: 'No Additional Image7',  priority: 'others', status: 'missing' },
  { field: 'additional_image8',  label: 'No Additional Image8',  priority: 'others', status: 'missing' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let inserted = 0;
  let skipped  = 0;

  for (const issue of ISSUES) {
    const result = await FeedAuditIssue.updateOne(
      { field: issue.field },         // match by field (unique)
      { $setOnInsert: issue },         // only insert if not exists
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(`  ✔ Inserted: [${issue.priority.padEnd(6)}] ${issue.label}`);
      inserted++;
    } else {
      console.log(`  ─ Skipped (exists): ${issue.field}`);
      skipped++;
    }
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} already existed.`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
