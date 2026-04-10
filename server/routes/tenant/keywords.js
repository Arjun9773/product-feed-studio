const express = require('express');
const auth = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');
const Merchant = require('../../models/Merchant');

const router = express.Router();

async function getMerchant(req) {
  const companyId = req.user.userType === 'super_admin'
    ? req.headers['x-tenant-id']
    : req.user.companyId;
  return await Merchant.findOne({ companyId });
}

// ─── GET /api/keywords/products ───────────────────────────────
// Products + keywords joined (separate collection)
router.get('/products', auth, tenantResolver, async (req, res) => {
  try {
    const products = await req.tenantDb.collection('products')
      .find({ is_active: true })
      .project({
        sourceId: 1, product_name: 1, brand: 1,
        category: 1, price: 1,
      })
      .toArray();

    // Fetch all keywords for this tenant in one query
    const sourceIds = products.map(p => p.sourceId);
    const keywordDocs = await req.tenantDb.collection('keywords')
      .find({ sourceId: { $in: sourceIds } })
      .toArray();

    // Map keywords by sourceId for quick lookup
    const kwMap = {};
    keywordDocs.forEach(k => {
      kwMap[k.sourceId] = {
        active:   k.active_keywords   || [],
        inactive: k.negative_keywords || [],
      };
    });

    // Join products + keywords
    const mapped = products.map(p => ({
      id:       p.sourceId,
      name:     p.product_name || '',
      sku:      p.sourceId,
      brand:    p.brand    || '',
      category: p.category || '',
      price:    p.price    || 0,
      status:   'active',
      active:   kwMap[p.sourceId]?.active   || [],
      inactive: kwMap[p.sourceId]?.inactive || [],
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/keywords/rules ──────────────────────────────────
router.get('/rules', auth, async (req, res) => {
  try {
    const merchant = await getMerchant(req);
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });
    res.json({ success: true, data: merchant.keyword_rules || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/keywords/rules ──────────────────────────────────
router.put('/rules', auth, async (req, res) => {
  try {
    const merchant = await getMerchant(req);
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });

    await Merchant.findByIdAndUpdate(
      merchant._id,
      { $set: { keyword_rules: req.body.rules } },
      { new: true }
    );
    res.json({ success: true, message: 'Rules saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/keywords/save ───────────────────────────────────
// Bulk upsert keywords → separate keywords collection
router.put('/save', auth, tenantResolver, async (req, res) => {
  try {
    const { updates } = req.body;
    // updates: [{ id: sourceId, active: [], inactive: [] }]

    if (!updates?.length) {
      return res.json({ success: true, message: 'Nothing to save' });
    }

    const bulkOps = updates.map(({ id, active, inactive }) => ({
      updateOne: {
        filter: { sourceId: String(id) },
        update: {
          $set: {
            sourceId:          String(id),
            active_keywords:   active   || [],
            negative_keywords: inactive || [],
            updatedAt:         new Date(),
          }
        },
        upsert: true, // இல்லன்னா create பண்ணும்
      }
    }));

    await req.tenantDb.collection('keywords').bulkWrite(bulkOps);

    // Index ensure பண்ணு (first time)
    await req.tenantDb.collection('keywords').createIndex(
      { sourceId: 1 },
      { unique: true }
    );

    res.json({ success: true, message: 'Keywords saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
