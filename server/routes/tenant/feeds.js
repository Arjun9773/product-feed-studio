const express = require('express');
const auth = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

const router = express.Router();

router.get('/', auth, tenantResolver, async (req, res) => {
  try {
    const feeds = await req.tenantDb.collection('feeds').find({}).toArray();
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, tenantResolver, async (req, res) => {
  try {
    const result = await req.tenantDb.collection('feeds').insertOne({ ...req.body, createdAt: new Date() });
    res.status(201).json({ message: 'Feed created', id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, tenantResolver, async (req, res) => {
  const { ObjectId } = require('mongodb');
  try {
    await req.tenantDb.collection('feeds').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    res.json({ message: 'Feed updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, tenantResolver, async (req, res) => {
  const { ObjectId } = require('mongodb');
  try {
    await req.tenantDb.collection('feeds').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Feed deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
