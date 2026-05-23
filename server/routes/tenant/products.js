const express  = require('express');
const mongoose = require('mongoose');
const auth     = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

const router = express.Router();

// ============================================================
// HELPER: GMC required fields check → status recalculate
// bulk-update பண்ணும்போது automatically call ஆகும்
// ============================================================
async function recalculateFieldStatus(tenantDb, sourceIds) {
  try {
    const FeedAuditIssue = mongoose.model('FeedAuditIssue');

    // DB-லயே gmc_required fields எடு — hard code இல்ல
    const gmcFields = await FeedAuditIssue
      .find({ isActive: true, gmc_required: true })
      .select('field')
      .lean();

    if (gmcFields.length === 0) return;

    const fieldNames = gmcFields.map(f => f.field);
    const productsCol = tenantDb.collection('products');

    // ஏதாவது ஒரு field null / empty / missing இருந்தா → pending
    const missingCondition = fieldNames.map(f => ({
      $or: [
        { [f]: { $exists: false } },
        { [f]: null },
        { [f]: '' },
      ],
    }));

    // Pending — ஏதாவது missing
    await productsCol.updateMany(
      {
        sourceId: { $in: sourceIds },
        $or: missingCondition,
      },
      { $set: { field_optimization_status: 'pending' } }
    );

    // Done — எல்லாம் filled
    await productsCol.updateMany(
      {
        sourceId: { $in: sourceIds },
        $nor: missingCondition,
      },
      { $set: { field_optimization_status: 'done' } }
    );
  } catch (err) {
    console.error('[recalculateFieldStatus] Error:', err.message);
  }
}

// ============================================================
// GET /api/products — All active products
// ============================================================
router.get('/', auth, tenantResolver, async (req, res) => {
  try {
    const products = await req.tenantDb.collection('products')
      .find({ is_active: true })
      .toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// GET /api/products/missing-field
// ============================================================
router.get('/missing-field', auth, tenantResolver, async (req, res) => {
  try {
    const { field, label } = req.query;
    if (!field) return res.status(400).json({ message: 'Field is required' });

    const auditCol  = req.tenantDb.collection('feed_audit_products');
    const matchQuery = label
      ? { field, label: decodeURIComponent(label) }
      : { field };

    const auditDocs = await auditCol.find({
      issues: { $elemMatch: matchQuery },
    }).toArray();

    if (auditDocs.length === 0) return res.json([]);

    const sourceIds = auditDocs.map(doc => doc.sourceId);
    const products  = await req.tenantDb.collection('products').find({
      is_active: true,
      sourceId:  { $in: sourceIds },
    }).toArray();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// GET /api/products/gmc-validation
// Feed generate பண்ணும் முன்னாடி — missing required fields check
// ============================================================
router.get('/gmc-validation', auth, tenantResolver, async (req, res) => {
  try {
    const FeedAuditIssue = mongoose.model('FeedAuditIssue');
    const productsCol    = req.tenantDb.collection('products');

    // DB-லயே gmc_required fields எடு
    const gmcFields = await FeedAuditIssue
      .find({ isActive: true, gmc_required: true })
      .select('field label')
      .lean();

    if (gmcFields.length === 0) {
      return res.json({ success: true, issues: [] });
    }

    // ஒவ்வொரு field-க்கும் missing count எடு
    const issues = await Promise.all(
      gmcFields.map(async ({ field, label }) => {
        const missingCount = await productsCol.countDocuments({
          is_active: true,
          $or: [
            { [field]: { $exists: false } },
            { [field]: null },
            { [field]: '' },
          ],
        });
        return { field, label, missingCount };
      })
    );

    // Missing இருக்கவை மட்டும் return பண்ணு
    const missing = issues.filter(i => i.missingCount > 0);

    return res.json({ success: true, issues: missing });
  } catch (err) {
    console.error('[gmc-validation] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GET /api/products/with-keywords
// ============================================================
router.get('/with-keywords', auth, tenantResolver, async (req, res) => {
  try {
    const HIDE_FIELDS = {
      _id: 0, __v: 0, feedId: 0, tenantId: 0, is_active: 0,deactivatedAt: 0,
        importedAt: 0, updatedAt: 0,field_optimization_status: 0,
        google_category_optimization_status: 0, keyword_optimization_status: 0,
    };

    const products = await req.tenantDb.collection('products')
      .find({ is_active: true }, { projection: HIDE_FIELDS })
      .toArray();

    const sourceIds   = products.map(p => p.sourceId);
    const keywordDocs = await req.tenantDb.collection('keywords')
      .find({ sourceId: { $in: sourceIds } })
      .toArray();

    const kwMap = {};
    keywordDocs.forEach(k => { kwMap[k.sourceId] = k.active_keywords || []; });

const withKeywords = products.map(p => ({
  ...p,
  product_name: p.title_optimization_status === 'done' && p.optimized_product_name
    ? p.optimized_product_name
    : p.product_name,
  active_keywords: kwMap[p.sourceId] || [],
}));

    const fieldConfig = [
      { key: 'sourceId',          readonly: true,  type: 'text',  pinOrder: 1  },
      { key: 'product_name',      readonly: false, type: 'text',  pinOrder: 2  },
      { key: 'brand',             readonly: false, type: 'text',  pinOrder: 3  },
      { key: 'price',             readonly: false, type: 'text',  pinOrder: 4  },
      { key: 'was_price',         readonly: false, type: 'text',  pinOrder: 5  },
      { key: 'category',          readonly: false, type: 'text',  pinOrder: 6  },
      { key: 'google_category',   readonly: false, type: 'text',  pinOrder: 7  },
      { key: 'color',             readonly: false, type: 'text',  pinOrder: 8  },
      { key: 'age_group',         readonly: false, type: 'text',  pinOrder: 9  },
      { key: 'gender',            readonly: false, type: 'text',  pinOrder: 10 },
      { key: 'material',          readonly: false, type: 'text',  pinOrder: 11 },
      { key: 'bl_size',           readonly: false, type: 'text',  pinOrder: 12 },
      { key: 'bl_upc',            readonly: false, type: 'text',  pinOrder: 13 },
      { key: 'gtin',              readonly: false, type: 'text',  pinOrder: 14 },
      { key: 'description',       readonly: false, type: 'text',  pinOrder: 15 },
      { key: 'short_description', readonly: false, type: 'text',  pinOrder: 16 },
      { key: 'quantity',          readonly: false, type: 'text',  pinOrder: 17 },
      { key: 'stock',             readonly: false, type: 'text',  pinOrder: 18 },
      { key: 'product_image',     readonly: false, type: 'image', pinOrder: 19 },
      { key: 'additional_image1', readonly: false, type: 'image', pinOrder: 20 },
      { key: 'additional_image2', readonly: false, type: 'image', pinOrder: 21 },
      { key: 'additional_image3', readonly: false, type: 'image', pinOrder: 22 },
      { key: 'additional_image4', readonly: false, type: 'image', pinOrder: 23 },
      { key: 'additional_image5', readonly: false, type: 'image', pinOrder: 24 },
      { key: 'additional_image6', readonly: false, type: 'image', pinOrder: 25 },
      { key: 'additional_image7', readonly: false, type: 'image', pinOrder: 26 },
      { key: 'additional_image8', readonly: false, type: 'image', pinOrder: 27 },
      { key: 'active_keywords',   readonly: false, type: 'text',  pinOrder: 28 },
      { key: 'item_code',         readonly: true,  type: 'text',  pinOrder: 29 },
      { key: 'product_url',       readonly: true,  type: 'url',   pinOrder: 30 },
      { key: 'url_key',           readonly: true,  type: 'text',  pinOrder: 31 },
      { key: 'custom_label_0',    readonly: false, type: 'text',  pinOrder: 32 },
      { key: 'custom_label_1',    readonly: false, type: 'text',  pinOrder: 33 },
      { key: 'custom_label_2',    readonly: false, type: 'text',  pinOrder: 34 },
      { key: 'custom_label_3',    readonly: false, type: 'text',  pinOrder: 35 },
      { key: 'custom_label_4',    readonly: false, type: 'text',  pinOrder: 36 },
    ];

    res.json({ products: withKeywords, fieldConfig });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// PUT /api/products/bulk-update
// ============================================================
router.put('/bulk-update', auth, tenantResolver, async (req, res) => {
  try {
    const { field, updates } = req.body;

    if (!field || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'field and updates are required' });
    }

    const sourceIds = updates.map(({ id }) => String(id));

    // Step 1: Field values update
    const bulkOps = updates.map(({ id, value }) => ({
      updateOne: {
        filter: { sourceId: String(id) },
        update: {
          $set: {
            [field]:   value?.trim() || null,
            updatedAt: new Date(),
          },
        },
      },
    }));
    await req.tenantDb.collection('products').bulkWrite(bulkOps);

    // Step 2: Audit collection-லயும் issue remove பண்ணு
    const auditBulkOps = sourceIds.map(id => ({
      updateOne: {
        filter: { sourceId: id },
        update: { $pull: { issues: { field } } },
      },
    }));
    await req.tenantDb.collection('feed_audit_products').bulkWrite(auditBulkOps);

    // Step 3: GMC required fields check → status recalculate
    // "done" or "pending" automatically set ஆகும்
    await recalculateFieldStatus(req.tenantDb, sourceIds);

    res.json({ success: true, message: `${updates.length} products updated successfully` });
  } catch (error) {
    console.error('[bulk-update] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// POST /api/products
// ============================================================
router.post('/', auth, tenantResolver, async (req, res) => {
  try {
    const result = await req.tenantDb.collection('products').insertOne({
      ...req.body,
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Product created', id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// PUT /api/products/:id  ← /bulk-update-க்கு கீழ இருக்கணும்
// ============================================================
router.put('/:id', auth, tenantResolver, async (req, res) => {
  const { ObjectId } = require('mongodb');
  try {
    await req.tenantDb.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// DELETE /api/products/:id
// ============================================================
router.delete('/:id', auth, tenantResolver, async (req, res) => {
  const { ObjectId } = require('mongodb');
  try {
    await req.tenantDb.collection('products').deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
