const express = require('express');
const auth = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

const router = express.Router();

router.get('/', auth, tenantResolver, async (req, res) => {
  try {
    const audits = await req.tenantDb.collection('feed_audits').find({}).sort({ createdAt: -1 }).toArray();
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, tenantResolver, async (req, res) => {
  try {
    const result = await req.tenantDb.collection('feed_audits').insertOne({ ...req.body, createdAt: new Date() });
    res.status(201).json({ message: 'Audit saved', id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
