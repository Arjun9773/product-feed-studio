const express = require('express');
const auth = require('../../middleware/auth');
const { registerFeedCron } = require('../../services/cronService');
const User = require('../../models/User');

const router = express.Router();

// Helper — find correct company based on role
async function getCompany(req) {
  if (req.user.role === 'super_admin') {
    // Super admin viewing a store — use x-tenant-id
    const tenantId = req.headers['x-tenant-id'];
    return await User.findOne({ store_id: tenantId });
  }
  // Normal store_admin — use their own _id
  return await User.findById(req.user.id);
}

// GET /api/feeds — Load feed config
router.get('/', auth, async (req, res) => {
  try {
    const company = await getCompany(req);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company.feed_info || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/feeds — Save feed config
router.put('/', auth, async (req, res) => {
    
  try {
    const { feedName, cmsUpload, feedFormat, importUrl, schedule, scheduleTime } = req.body;

    const company = await getCompany(req);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    // Update feed_info nested fields
    await User.findByIdAndUpdate(
      company._id,
      {
        $set: {
          'feed_info.feed_name':      feedName,
          'feed_info.cms_upload_type': cmsUpload,
          'feed_info.feed_type':       feedFormat,
          'feed_info.feed_url':        importUrl,
          'feed_info.schedule_info':   schedule,
          'feed_info.import_time':     scheduleTime,
        },
      },
      { new: true }
    );

    // Re-register cron with updated config
    registerFeedCron(company.store_id, {
      _id:          company._id,
      feedName:     feedName,
      importUrl:    importUrl,
      schedule:     schedule,
      scheduleTime: scheduleTime,
    });

    res.json({ message: 'Feed configuration saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;