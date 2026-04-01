const express = require('express');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const auth = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

const router = express.Router();

// ─── HELPERS ─────────────────────────────────────────────────

function generateIdName(tenantId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const raw = `${tenantId}_${timestamp}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

function getDataField(position) {
  return `custom_label_${position}`;
}

function getLabelName(position) {
  return `Custom Label ${position}`;
}

// ─── GET all labels (feedId filter) ──────────────────────────

router.get('/', auth, tenantResolver, async (req, res) => {
  try {
    const { feedId } = req.query;
    const filter = { archived: 0 };
    if (feedId) filter.feedId = feedId;

    const labels = await req.tenantDb
      .collection('custom_labels')
      .find(filter)
      .sort({ position: 1, created_date: 1 })
      .toArray();

    res.json(labels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST — add new label value ───────────────────────────────
// Body: { feedId, label_value, position, id_name? }
// position 0 → new id_name create ஆகும்
// position 1–4 → frontend id_name pass பண்ணணும்

router.post('/', auth, tenantResolver, async (req, res) => {
  try {
    const { feedId, label_value, position, id_name } = req.body;

    // validate
    // if (!feedId)      return res.status(400).json({ message: 'feedId required' });
    if (!label_value) return res.status(400).json({ message: 'label_value required' });
    if (position === undefined || position === null)
                      return res.status(400).json({ message: 'position required' });

    const tenantId = req.tenantId; // tenantResolver set பண்றது

    // position 0 → புதுசா id_name create பண்ணு
    // position 1–4 → frontend-ல இருந்து id_name வரும்
    const groupIdName = position === 0
      ? generateIdName(tenantId)
      : id_name;

    if (!groupIdName) {
      return res.status(400).json({ message: 'id_name required for position 1–4' });
    }

    // position + tenantId combination already exists-ஆ check பண்ணு
    // const existing = await req.tenantDb
    //   .collection('custom_labels')
    //   .findOne({ 
    //     tenantId, 
    //     position, 
    //     id_name: groupIdName,
    //     archived: 0 
    //   });

    // if (existing) {
    //   return res.status(409).json({ message: 'Label already exists for this position' });
    // }


    const doc = {
      tenantId,
      feedId,
      data_field:   getDataField(position),   // "custom_label_0"
      label:        getLabelName(position),    // "Custom Label 0"
      label_value,                             // "summer_sale"
      archived:     0,
      prodcount:    0,
      position,
      id_name:      groupIdName,
      created_date: new Date(),
    };

    const existing = await req.tenantDb
      .collection('custom_labels')
      .findOne({ 
        tenantId, 
        position, 
        id_name: groupIdName,
        archived: 0 
      });

    if (existing) {
      return res.status(409).json({ message: 'Label already exists for this position' });
    }

    const result = await req.tenantDb
      .collection('custom_labels')
      .insertOne(doc);

    res.status(201).json({
      message: 'Label created',
      id:      result.insertedId,
      id_name: groupIdName,  // frontend-க்கு return பண்ணு — next position-க்கு use பண்ண
      data:    doc,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT — rename label value ─────────────────────────────────

router.put('/:id', auth, tenantResolver, async (req, res) => {
  try {
    const { label_value } = req.body;

    await req.tenantDb
      .collection('custom_labels')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { label_value, updatedAt: new Date() } }
      );

    res.json({ message: 'Label updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE — archive label ───────────────────────────────────

router.delete('/:id', auth, tenantResolver, async (req, res) => {
  try {
    // hard delete பண்றதை விட archive பண்றது better
    await req.tenantDb
      .collection('custom_labels')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { archived: 1, archivedAt: new Date() } }
      );

    res.json({ message: 'Label archived' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT — update prodcount ───────────────────────────────────
// products assign ஆகும்போது count update பண்ண

router.put('/:id/prodcount', auth, tenantResolver, async (req, res) => {
  try {
    const { count } = req.body;

    await req.tenantDb
      .collection('custom_labels')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { prodcount: count, updatedAt: new Date() } }
      );

    res.json({ message: 'Prodcount updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
