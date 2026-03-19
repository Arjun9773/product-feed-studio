const express = require('express');
const auth = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');
const { importFeedForTenant } = require('../../services/cronService');
const Merchant = require('../../models/Merchant');

const router = express.Router();

// GET /api/audit/feed-audit — Load audit summary for a store
router.get('/feed-audit', auth, tenantResolver, async (req, res) => {
  try {
    const tenantDb       = req.tenantDb;
    const auditCol       = tenantDb.collection('feed_audit_products');
    const productsCol    = tenantDb.collection('products');

    // Total products count
    const totalProducts = await productsCol.countDocuments({ is_active: true });

    if (totalProducts === 0) {
      return res.json({
        success: true,
        data: {
          totalProducts: 0,
          totalIssues:   0,
          healthScore:   100,
          issues: { high: [], medium: [], low: [], others: [] }
        }
      });
    }

    // Get all audit results
    const auditDocs = await auditCol.find({}).toArray();

    // Group issues by priority
    const issueMap = {};

    for (const doc of auditDocs) {
      for (const issue of (doc.issues || [])) {
        const key = issue.label;
        if (!issueMap[key]) {
          issueMap[key] = {
            issue:    key,
            priority: issue.priority,
            products: 0,
          };
        }
        issueMap[key].products++;
      }
    }

    // Format issues with percentage
    const grouped = { high: [], medium: [], low: [], others: [] };
    for (const item of Object.values(issueMap)) {
      const pct = Math.round((item.products / totalProducts) * 100);
      const entry = {
        issue:      item.issue,
        products:   item.products,
        percentage: `${pct}%`,
      };
      if (grouped[item.priority]) {
        grouped[item.priority].push(entry);
      } else {
        grouped.others.push(entry);
      }
    }

    // Health score
    const totalIssues  = Object.values(grouped).flat().length;
    const healthScore  = Math.max(0, Math.round(100 - (totalIssues / 11) * 100));

    res.json({
      success: true,
      data: {
        totalProducts,
        totalIssues,
        healthScore,
        issues: grouped,
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/audit/refresh — Manually trigger feed import + audit
router.post('/refresh', auth, tenantResolver, async (req, res) => {
  try {
    // Get merchant feed config
    const merchant = await Merchant.findOne({ companyId: req.tenantId });
    if (!merchant || !merchant.feed_info?.feed_url) {
      return res.status(400).json({
        success: false,
        message: 'No feed URL configured. Please set up feed first.'
      });
    }

    // Trigger import immediately
    await importFeedForTenant(req.tenantId, {
      _id:          merchant._id,
      feedName:     merchant.feed_info.feed_name,
      importUrl:    merchant.feed_info.feed_url,
      schedule:     merchant.feed_info.schedule_info,
      scheduleTime: merchant.feed_info.import_time,
    });

    res.json({ success: true, message: 'Feed refreshed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;