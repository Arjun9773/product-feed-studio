const express = require('express');
const auth = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');
const FeedAuditIssueSchema = require('../../models/FeedAuditIssue');
const router = express.Router();
const mongoose = require('mongoose');

// ============================================
// CONSTANTS
// ============================================
const PRIORITY_WEIGHTS = {
  high:   1.0,
  medium: 0.5,
  low:    0.2,
  others: 0.1,
};

const TOTAL_POSSIBLE_PENALTY = Object.values(PRIORITY_WEIGHTS).reduce(
  (sum, w) => sum + w, 0
);

const ISSUE_FIELDS = [
  // HIGH
  { field: 'color',             label: 'No Colour',            priority: 'high'   },
  { field: 'age_group',         label: 'No Age Group',         priority: 'high'   },
  { field: 'gender',            label: 'No Gender',            priority: 'high'   },
  { field: 'material',          label: 'No Material',          priority: 'high'   },
  { field: 'brand',             label: 'No Brand',             priority: 'high'   },
  { field: 'google_category',   label: 'No Google Category',   priority: 'high'   },
  { field: 'additional_image1', label: 'No Additional Image1', priority: 'high'   },
  { field: 'additional_image2', label: 'No Additional Image2', priority: 'high'   },
  { field: 'additional_image3', label: 'No Additional Image3', priority: 'high'   },
  { field: 'additional_image4', label: 'No Additional Image4', priority: 'high'   },
  { field: 'additional_image5', label: 'No Additional Image5', priority: 'high'   },
  // MEDIUM
  { field: 'pattern',           label: 'No Pattern',           priority: 'medium' },
  { field: 'description',       label: 'No Description',       priority: 'medium' },
  { field: 'short_description', label: 'No Short Description',  priority: 'medium' },
  { field: 'gtin',              label: 'No GTIN',              priority: 'medium' },
  // OTHERS
  { field: 'url_key',            label: 'No Url Key',            priority: 'others' },
  { field: 'meta_title',         label: 'No Meta Title',         priority: 'others' },
  { field: 'bl_size',            label: 'No Bl Size',            priority: 'others' },
  { field: 'quantity',           label: 'No Quantity',           priority: 'others' },
  { field: 'was_price',          label: 'No Was Price',          priority: 'others' },
  { field: 'sku_variation',      label: 'No Sku Variation',      priority: 'others' },
  { field: 'bl_upc',             label: 'No Bl Upc',             priority: 'others' },
  { field: 'product_highlight1', label: 'No Product Highlight1', priority: 'others' },
  { field: 'product_highlight2', label: 'No Product Highlight2', priority: 'others' },
  { field: 'product_highlight3', label: 'No Product Highlight3', priority: 'others' },
  { field: 'product_highlight4', label: 'No Product Highlight4', priority: 'others' },
  { field: 'product_highlight5', label: 'No Product Highlight5', priority: 'others' },
  { field: 'additional_image6',  label: 'No Additional Image6',  priority: 'others' },
  { field: 'additional_image7',  label: 'No Additional Image7',  priority: 'others' },
  { field: 'additional_image8',  label: 'No Additional Image8',  priority: 'others' },
];

// ============================================
// HELPER: Build audit grouped response
// feed-audit GET + refresh POST — இரண்டுக்கும் use ஆகும்
// ============================================
async function buildAuditResponse(tenantDb) {
  const productsCol = tenantDb.collection('products');
  const auditCol    = tenantDb.collection('feed_audit_products');

  // ── Total active products ──
  const totalProducts = await productsCol.countDocuments({ is_active: true });

  if (totalProducts === 0) {
    return {
      totalProducts: 0,
      totalIssues:   0,
      healthScore:   100,
      issues: { high: [], medium: [], low: [], others: [] },
    };
  }

  // ── Active sourceIds மட்டும் எடு — stale docs filter ஆகும் ──
  const activeProducts = await productsCol
    .find({ is_active: true }, { projection: { sourceId: 1 } })
    .toArray();
  const activeSourceIds = activeProducts.map(p => p.sourceId);

  // ── Active products audit docs மட்டும் எடு ──
  const auditDocs = await auditCol
    .find({ sourceId: { $in: activeSourceIds } })
    .toArray();

  // ── Issue map build — Set for unique product tracking ──
  const issueMap = {};
  for (const doc of auditDocs) {
    for (const issue of (doc.issues || [])) {
      const key = issue.label;
      if (!issueMap[key]) {
        issueMap[key] = {
          issue:      key,
          field:      issue.field,
          priority:   issue.priority,
          productIds: new Set(),
        };
      }
      issueMap[key].productIds.add(doc.sourceId);
    }
  }

  // ── Group by priority ──
  const grouped = { high: [], medium: [], low: [], others: [] };
  for (const item of Object.values(issueMap)) {
    const uniqueCount = item.productIds.size;
    const pct         = Math.round((uniqueCount / totalProducts) * 100);
    const entry = {
      issue:      item.issue,
      field:      item.field,
      products:   uniqueCount,
      percentage: `${pct}%`,
    };
    if (grouped[item.priority]) {
      grouped[item.priority].push(entry);
    } else {
      grouped.others.push(entry);
    }
  }

  // ── Sort by products desc ──
  for (const priority of Object.keys(grouped)) {
    grouped[priority].sort((a, b) => b.products - a.products);
  }

  // ── Total issues ──
  const totalIssues = Object.values(grouped).flat().length;

  // ── Health score ──
  let actualPenalty = 0;
  for (const item of Object.values(issueMap)) {
    const weight   = PRIORITY_WEIGHTS[item.priority] ?? 0.1;
    const coverage = item.productIds.size / totalProducts;
    actualPenalty += weight * coverage;
  }
  const healthScore = Math.max(
    0,
    Math.round((1 - actualPenalty / TOTAL_POSSIBLE_PENALTY) * 100)
  );

  return { totalProducts, totalIssues, healthScore, issues: grouped };
}

// ============================================
// HELPER: Recalculate feed_audit_products
// bulk-update / refresh — இரண்டுக்கும் use ஆகும்
// ============================================
async function recalculateAudit(tenantDb) {
  const productsCol = tenantDb.collection('products');
  const auditCol    = tenantDb.collection('feed_audit_products');

  const products = await productsCol.find({ is_active: true }).toArray();
  
  console.log('[AUDIT] Total products:', products.length); // ✅ add

  const activeSources = products.map(p => p.sourceId);
  await auditCol.deleteMany({ sourceId: { $nin: activeSources } });

  const bulkOps = products.map(product => {
    const issues = ISSUE_FIELDS.filter(({ field }) => {
      const val = product[field];
      return val === null || val === undefined || val === '' || val === 'null';
    });

    console.log(`[AUDIT] ${product.sourceId} | description: ${product.description} | issues: ${issues.map(i => i.field)}`); // ✅ add

    return {
      updateOne: {
        filter: { sourceId: product.sourceId },
        update: { $set: { issues, updatedAt: new Date() } },
        upsert: true,
      },
    };
  });

  const result = await auditCol.bulkWrite(bulkOps);
  console.log('[AUDIT] bulkWrite result:', result.modifiedCount, result.upsertedCount); // ✅ add
  
  return { updated: products.length };
}

// ============================================
// GET /api/audit/feed-audit
// ============================================
router.get('/feed-audit', auth, tenantResolver, async (req, res) => {
  try {
    const data = await buildAuditResponse(req.tenantDb);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[feed-audit] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// POST /api/audit/refresh
// ============================================
router.post('/refresh', auth, tenantResolver, async (req, res) => {
  try {
    const { updated } = await recalculateAudit(req.tenantDb);
    return res.json({
      success: true,
      message: `Feed audit refreshed for ${updated} products`,
    });
  } catch (error) {
    console.error('[audit/refresh] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// GET /api/audit/fields
// ============================================
const PRIORITY_ORDER = { high: 1, medium: 2, low: 3, others: 4 };

router.get('/fields', auth, tenantResolver, async (req, res) => {
  try {
    const FeedAuditIssue =
      mongoose.models?.FeedAuditIssue ||
      mongoose.model('FeedAuditIssue', FeedAuditIssueSchema);

    const fields = await FeedAuditIssue
      .find({ isActive: true })
      .select('field label group priority status gmc_required')
      .lean();

    fields.sort((a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 5) - (PRIORITY_ORDER[b.priority] ?? 5)
    );

    return res.json({ success: true, data: fields });
  } catch (err) {
    console.error('[AUDIT] /fields error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
