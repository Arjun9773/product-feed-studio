const express = require('express');
const auth = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');
const { importFeedForTenant } = require('../../services/cronService');
const Merchant = require('../../models/Merchant');
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

// Fixed denominator — worst case if ALL priority types
// had 100% product coverage
// 1.0 + 0.5 + 0.2 + 0.1 = 1.8
const TOTAL_POSSIBLE_PENALTY = Object.values(PRIORITY_WEIGHTS).reduce(
  (sum, w) => sum + w,
  0
);

// ============================================
// GET /api/audit/feed-audit
// ============================================
router.get('/feed-audit', auth, tenantResolver, async (req, res) => {
  try {
    const tenantDb    = req.tenantDb;
    const auditCol    = tenantDb.collection('feed_audit_products');
    const productsCol = tenantDb.collection('products');

    // Total active products
    const totalProducts = await productsCol.countDocuments({ is_active: true });

    if (totalProducts === 0) {
      return res.json({
        success: true,
        data: {
          totalProducts: 0,
          totalIssues:   0,
          healthScore:   100,
          issues: { high: [], medium: [], low: [], others: [] },
        },
      });
    }

    // Fetch all audit docs
    const auditDocs = await auditCol.find({}).toArray();

    // ── Build issue map ──────────────────────────────
    // issueMap[label] = { issue, priority, field, productIds (Set) }
    // ✅ Use Set to track unique sourceIds — prevents double counting
    // when one product has multiple audit docs
    const issueMap = {};

    for (const doc of auditDocs) {
      for (const issue of (doc.issues || [])) {
        const key = issue.label;
        if (!issueMap[key]) {
          issueMap[key] = {
            issue:      key,
            field:      issue.field,
            priority:   issue.priority,
            productIds: new Set(), // ✅ unique product tracking
          };
        }
        // ✅ Add sourceId — duplicates automatically ignored by Set
        issueMap[key].productIds.add(doc.sourceId);
      }
    }

    // ── Group by priority with percentage ────────────
    const grouped = { high: [], medium: [], low: [], others: [] };

    for (const item of Object.values(issueMap)) {
      const uniqueCount = item.productIds.size; // ✅ unique product count
      const pct         = Math.round((uniqueCount / totalProducts) * 100);
      const entry       = {
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

    // ── Sort each priority group by products desc ────
    for (const priority of Object.keys(grouped)) {
      grouped[priority].sort((a, b) => b.products - a.products);
    }

    // ── Total issues count ───────────────────────────
    const totalIssues = Object.values(grouped).flat().length;

    // ── Health score (industry-standard, absolute penalty) ──
    let actualPenalty = 0;

    for (const item of Object.values(issueMap)) {
      const weight      = PRIORITY_WEIGHTS[item.priority] ?? 0.1;
      const uniqueCount = item.productIds.size; // ✅ use unique count here too
      const coverage    = uniqueCount / totalProducts;
      actualPenalty    += weight * coverage;
    }

    const healthScore = Math.max(
      0,
      Math.round((1 - actualPenalty / TOTAL_POSSIBLE_PENALTY) * 100)
    );

    return res.json({
      success: true,
      data: {
        totalProducts,
        totalIssues,
        healthScore,
        issues: grouped,
      },
    });

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
    const merchant = await Merchant.findOne({ companyId: req.tenantId });

    if (!merchant || !merchant.feed_info?.feed_url) {
      return res.status(400).json({
        success: false,
        message: 'No feed URL configured. Please set up feed first.',
      });
    }

    await importFeedForTenant(req.tenantId, {
      _id:          merchant._id,
      feedName:     merchant.feed_info.feed_name,
      importUrl:    merchant.feed_info.feed_url,
      schedule:     merchant.feed_info.schedule_info,
      scheduleTime: merchant.feed_info.import_time,
    });

    return res.json({ success: true, message: 'Feed refreshed successfully' });

  } catch (error) {
    console.error('[audit/refresh] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

const PRIORITY_ORDER = { high: 1, medium: 2, low: 3, others: 4 };

// ============================================
// GET /api/audit/fields
// Feed audit issue definitions from DB
// ============================================
router.get('/fields', auth, tenantResolver, async (req, res) => {
  try {
    const FeedAuditIssue =
      mongoose.models?.FeedAuditIssue ||
      mongoose.model('FeedAuditIssue', FeedAuditIssueSchema);

    const fields = await FeedAuditIssue
      .find({ isActive: true })
      .select('field label group priority statusgmc_required')
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
