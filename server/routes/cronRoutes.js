// routes/cronRoutes.js
const express = require('express');
const router  = express.Router();
const { getCronStatus, initAllCrons, registerFeedCron } = require('../services/cronService');

// GET /api/cron/status — Check all running cron jobs
router.get('/status', (req, res) => {
  const status = getCronStatus();
  res.json({
    success: true,
    ...status
  });
});

// POST /api/cron/run-now/:tenantId — Manually trigger cron for testing
router.post('/run-now/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const mainDb  = require('mongoose').connection.useDb(process.env.MAIN_DB_NAME); // ✅ FIXED: uses MAIN_DB_NAME from .env — not hardcoded
    const company = await mainDb.collection('gmc_admin_companies')
      .findOne({ store_id: tenantId });

    if (!company) {
      return res.json({ success: false, message: 'Company not found' });
    }

    const { importFeedForTenant } = require('../services/cronService');

    // Run immediately without waiting for schedule
    importFeedForTenant(tenantId, {
      _id:          company._id,
      feedName:     company.shopName,
      importUrl:    company.feed_info.feed_url,
      schedule:     company.feed_info.schedule_info,
      scheduleTime: company.feed_info.import_time,
    });

    res.json({
      success: true,
      message: `Cron triggered for tenant: ${tenantId}`
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
