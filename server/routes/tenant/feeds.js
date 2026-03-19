const express = require("express");
const auth = require("../../middleware/auth");
const { registerFeedCron } = require("../../services/cronService");
const Merchant = require("../../models/Merchant");

const router = express.Router();

// Helper — find correct merchant based on role
async function getMerchant(req) {
  if (req.user.userType === "super_admin") {
    // Super admin viewing a store — use x-tenant-id header
    const companyId = req.headers["x-tenant-id"];
    return await Merchant.findOne({ companyId });
  }
  // Normal store_admin — use their own companyId from token
  return await Merchant.findOne({ companyId: req.user.companyId });
}

// GET /api/feeds — Load feed config from merchant document
router.get("/", auth, async (req, res) => {
  try {
    const merchant = await getMerchant(req);
    if (!merchant)
      return res.status(404).json({ message: "Merchant not found" });
    res.json(merchant.feed_info || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/feeds — Save feed config (super_admin only)
router.put("/", auth, async (req, res) => {
  try {
    // Only super_admin can update feed config
    if (req.user.userType !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Only super admin can update feed configuration" });
    }

    const {
      feedName,
      cmsUpload,
      feedFormat,
      importUrl,
      schedule,
      scheduleTime,
    } = req.body;

    const merchant = await getMerchant(req);
    if (!merchant)
      return res.status(404).json({ message: "Merchant not found" });

    // Update feed_info nested fields inside merchant document
    await Merchant.findByIdAndUpdate(
      merchant._id,
      {
        $set: {
          feed_info: {
            feed_name: feedName,
            cms_upload_type: cmsUpload,
            feed_type: feedFormat,
            feed_url: importUrl,
            schedule_info: schedule,
            import_time: scheduleTime,
          },
        },
      },
      { new: true },
    );

    // Re-register cron with updated config using companyId as tenantId
    registerFeedCron(merchant.companyId, {
      _id: merchant._id,
      feedName: feedName,
      importUrl: importUrl,
      schedule: schedule,
      scheduleTime: scheduleTime,
    });

    res.json({ message: "Feed configuration saved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
