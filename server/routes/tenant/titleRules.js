const express = require("express");
const auth = require("../../middleware/auth");
const tenantResolver = require("../../middleware/tenantResolver");

const router = express.Router();

router.get("/", auth, tenantResolver, async (req, res) => {
  try {
    const rules = await req.tenantDb
      .collection("title_rules")
      .find({})
      .toArray();

    const rulesWithCount = await Promise.all(
      rules.map(async (rule) => {
        const productsCount = await req.tenantDb
          .collection("products")
          .countDocuments({ category: rule.category });
        return { ...rule, productsCount };
      })
    );

    res.json(rulesWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET /api/products/preview-products?category=xyz — Preview products for a category title optimization
router.get('/preview-products', auth, tenantResolver, async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    const products = await req.tenantDb
      .collection('products')
      .find({ is_active: true, category: category })
      .limit(5)
      .toArray();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

router.post("/", auth, tenantResolver, async (req, res) => {
  try {
    const result = await req.tenantDb
      .collection("title_rules")
      .insertOne({ ...req.body, createdAt: new Date() });
    res.status(201).json({ message: "Rule created", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", auth, tenantResolver, async (req, res) => {
  const { ObjectId } = require("mongodb");
  try {
    await req.tenantDb
      .collection("title_rules")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { ...req.body, updatedAt: new Date() } },
      );
    res.json({ message: "Rule updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", auth, tenantResolver, async (req, res) => {
  const { ObjectId } = require("mongodb");
  try {
    await req.tenantDb
      .collection("title_rules")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Rule deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/run", auth, tenantResolver, async (req, res) => {
  const { ObjectId } = require("mongodb");
  try {
    const rule = await req.tenantDb.collection("title_rules").findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!rule) return res.status(404).json({ message: "Rule not found" });

    const structure = rule.titleOptStructure.split(",").map((f) => f.trim());

    const products = await req.tenantDb
      .collection("products")
      .find({ category: rule.category })
      .toArray();

    if (products.length === 0) {
      return res.json({
        message: "No products found for this category",
        updated: 0,
      });
    }

    const bulkOps = [];

    for (const product of products) {
      let cleanName = product.product_name || "";

      for (const field of structure) {
        if (field === "product_name") continue;
        const val = product[field];
        if (val && cleanName.toLowerCase().includes(val.toLowerCase())) {
          const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          cleanName = cleanName
            .replace(new RegExp(`\\(\\s*${escaped}\\s*\\)`, "gi"), "")
            .trim();

          //
          cleanName = cleanName.replace(new RegExp(escaped, "gi"), "").trim();
        }
      }

      // Cleanup
      cleanName = cleanName
        .replace(/\(\s*\)/g, "") // empty ()
        .replace(/\[\s*\]/g, "") // empty []
        .replace(/\(\s*,?\s*\)/g, "") // (,) or ( , )
        .replace(/,\s*\)/g, ")") // "MS2043DB, )" → "MS2043DB)"
        .replace(/\(\s*,/g, "(") // "(, Black)" → "(Black)"
        .replace(/[-–]\s*[A-Z0-9]{4,}/g, "") // SKU pattern
        .replace(/\s+/g, " ")
        .trim();

      const parts = structure
        .map((field) => {
          if (field === "product_name") return cleanName;
          const val = product[field] || "";
          if (val && cleanName.toLowerCase().includes(val.toLowerCase()))
            return "";
          return val;
        })
        .filter(Boolean);

      const optimizedName = parts.join(" ").trim();

      bulkOps.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              optimized_product_name: optimizedName,
              title_optimization_status: "done",
            },
          },
        },
      });
    }

    if (bulkOps.length > 0) {
      await req.tenantDb.collection("products").bulkWrite(bulkOps);
    }

    await req.tenantDb
      .collection("title_rules")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "completed", lastRunAt: new Date() } },
      );

    res.json({ message: "Rule applied successfully", updated: bulkOps.length });
  } catch (error) {
    await req.tenantDb
      .collection("title_rules")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "failed" } },
      )
      .catch(() => {});

    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
