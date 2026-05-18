const express = require("express");
const router = express.Router();
const Integration = require("../models/Integration");
const UserIntegration = require("../models/UserIntegration");
const auth = require("../middleware/auth");

// GET /api/integrations
router.get("/", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const [integrations, userIntegrations] = await Promise.all([
      Integration.find({ isActive: true }),
      UserIntegration.find({ companyId }),
    ]);

    const result = integrations.map((int) => ({
      id:        int.id,
      name:      int.name,
      path:      int.path,
      desc:      int.desc,
      category:  int.category,
      connected: userIntegrations.some(
        (ui) => ui.integrationId === int.id && ui.connected
      ),
    }));

    res.json(result);
  } catch (err) {
    console.error("[GET /integrations]", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/integrations/:id/toggle
router.patch("/:id/toggle", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const integrationId = req.params.id;

    const integration = await Integration.findOne({ id: integrationId });
    if (!integration) {
      return res.status(404).json({ message: "Integration not found" });
    }

    const existing = await UserIntegration.findOne({ companyId, integrationId });

    if (existing) {
      existing.connected = !existing.connected;
      existing.connectedAt = existing.connected ? new Date() : null;
      await existing.save();
      return res.json({ connected: existing.connected });
    } else {
      const newInt = await UserIntegration.create({
        companyId,
        integrationId,
        connected: true,
        connectedAt: new Date(),
      });
      return res.json({ connected: newInt.connected });
    }
  } catch (err) {
    console.error("[PATCH /integrations/:id/toggle]", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
