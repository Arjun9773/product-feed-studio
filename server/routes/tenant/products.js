const express = require('express');
const auth = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

const router = express.Router();

// GET /api/products — All products
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

// GET /api/products/missing-field?field=color — Products missing a specific field
router.get('/missing-field', auth, tenantResolver, async (req, res) => {
  try {
    const { field } = req.query;
    if (!field) return res.status(400).json({ message: 'Field is required' });

    // Find products where field is empty/null/missing
    const products = await req.tenantDb.collection('products').find({
      is_active: true,
      $or: [
        { [field]: { $exists: false } },
        { [field]: null },
        { [field]: '' },
      ]
    }).toArray();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products
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

// PUT /api/products/:id — Update single product field
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

// PUT /api/products/bulk-update — Update multiple products at once
router.put('/bulk-update', auth, tenantResolver, async (req, res) => {
  try {
    const { field, updates } = req.body;
    // updates = [{ id: "xxx", value: "Red" }, ...]

    const bulkOps = updates.map(({ id, value }) => ({
      updateOne: {
        filter: { sourceId: String(id) },
        update: { $set: { [field]: value, updatedAt: new Date() } }
      }
    }));

    await req.tenantDb.collection('products').bulkWrite(bulkOps);

    // Update audit results too
    const auditBulkOps = updates.map(({ id }) => ({
      updateOne: {
        filter: { sourceId: String(id) },
        update: {
          $pull: {
            issues: { field }
          }
        }
      }
    }));
    await req.tenantDb.collection('feed_audit_products').bulkWrite(auditBulkOps);

    res.json({ message: 'Products updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth, tenantResolver, async (req, res) => {
  const { ObjectId } = require('mongodb');
  try {
    await req.tenantDb.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;