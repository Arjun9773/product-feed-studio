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
// router.get('/missing-field', auth, tenantResolver, async (req, res) => {
//   try {
//     const { field } = req.query;
//     if (!field) return res.status(400).json({ message: 'Field is required' });

//     // Find products where field is empty/null/missing
//     const products = await req.tenantDb.collection('products').find({
//       is_active: true,
//       $or: [
//         { [field]: { $exists: false } },
//         { [field]: null },
//         { [field]: '' },
//       ]
//     }).toArray();

//     res.json(products);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });
router.get('/missing-field', auth, tenantResolver, async (req, res) => {
  try {
    const { field, label } = req.query;
    if (!field) return res.status(400).json({ message: 'Field is required' });

    const auditCol = req.tenantDb.collection('feed_audit_products');

    // label இருந்தா field + label match, இல்லன்னா field மட்டும்
    const matchQuery = label
      ? { field, label: decodeURIComponent(label) }
      : { field };

    const auditDocs = await auditCol.find({
      issues: { $elemMatch: matchQuery }
    }).toArray();

    if (auditDocs.length === 0) return res.json([]);

    const sourceIds = auditDocs.map(doc => doc.sourceId);

    const products = await req.tenantDb.collection('products').find({
      is_active: true,
      sourceId: { $in: sourceIds }
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
// router.put('/:id', auth, tenantResolver, async (req, res) => {
//   const { ObjectId } = require('mongodb');
//   try {
//     await req.tenantDb.collection('products').updateOne(
//       { _id: new ObjectId(req.params.id) },
//       { $set: { ...req.body, updatedAt: new Date() } }
//     );
//     res.json({ message: 'Product updated' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// PUT /api/products/bulk-update — Update multiple products at once
// ✅ STEP 1: bulk-update FIRST (before /:id)
// router.put('/bulk-update', auth, tenantResolver, async (req, res) => {
//   try {
//     const { field, updates } = req.body;

//     const bulkOps = updates.map(({ id, value }) => ({
//       updateOne: {
//         filter: { sourceId: String(id) },
//         update: { $set: { [field]: value, updatedAt: new Date() } }
//       }
//     }));

//     await req.tenantDb.collection('products').bulkWrite(bulkOps);

//     const auditBulkOps = updates.map(({ id }) => ({
//       updateOne: {
//         filter: { sourceId: String(id) },
//         update: { $pull: { issues: { field } } }
//       }
//     }));
//     await req.tenantDb.collection('feed_audit_products').bulkWrite(auditBulkOps);

//     res.json({ message: 'Products updated successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });
// router.put('/bulk-update', auth, tenantResolver, async (req, res) => {
//   try {
//     const { field, updates } = req.body;

//     const bulkOps = updates.map(({ id, value }) => ({
//       updateOne: {
//         filter: { sourceId: String(id) },
//         update: { 
//           $set: { 
//             [field]:                    value, 
//             field_optimization_status: 'completed',  // ← இது மட்டும் add பண்ணணும்
//             updatedAt:                  new Date() 
//           } 
//         }
//       }
//     }));

//     await req.tenantDb.collection('products').bulkWrite(bulkOps);

//     const auditBulkOps = updates.map(({ id }) => ({
//       updateOne: {
//         filter: { sourceId: String(id) },
//         update: { $pull: { issues: { field } } }
//       }
//     }));
//     await req.tenantDb.collection('feed_audit_products').bulkWrite(auditBulkOps);

//     res.json({ message: 'Products updated successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });
router.put('/bulk-update', auth, tenantResolver, async (req, res) => {
  try {
    const { field, updates } = req.body;

    const bulkOps = updates.map(({ id, value }) => ({
      updateOne: {
        filter: { sourceId: String(id) },
        update: { 
          $set: { 
            [field]:                    value?.trim() || null,  // ← இது மட்டும் மாத்து
            field_optimization_status: 'completed',
            updatedAt:                  new Date() 
          } 
        }
      }
    }));

    await req.tenantDb.collection('products').bulkWrite(bulkOps);

    const auditBulkOps = updates.map(({ id }) => ({
      updateOne: {
        filter: { sourceId: String(id) },
        update: { $pull: { issues: { field } } }
      }
    }));
    await req.tenantDb.collection('feed_audit_products').bulkWrite(auditBulkOps);

    res.json({ message: 'Products updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ STEP 2: /:id AFTER
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


// for keywords
// products.js-ல இதை add பண்ணு (existing route தொடாதே)

// GET /api/products/with-keywords
router.get('/with-keywords', auth, tenantResolver, async (req, res) => {
  try {
    const products = await req.tenantDb.collection('products')
      .find({ is_active: true })
      .toArray();

    const sourceIds  = products.map(p => p.sourceId);
    const keywordDocs = await req.tenantDb.collection('keywords')
      .find({ sourceId: { $in: sourceIds } })
      .toArray();

    const kwMap = {};
    keywordDocs.forEach(k => { kwMap[k.sourceId] = k.active_keywords || []; });

    const withKeywords = products.map(p => ({
      ...p,
      active_keywords: kwMap[p.sourceId] || [],
    }));

    res.json(withKeywords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
