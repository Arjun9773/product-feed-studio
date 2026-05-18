// routes/tenant/competitorPrice.route.js

const express = require("express");
const router  = express.Router();
const auth    = require("../../middleware/auth");
const tenantResolver = require("../../middleware/tenantResolver");

// ── GET /api/competitor-price/list ──────────────────────────
// Flow:
//  1. req.tenantDb மூலம் products எடு (tenant isolated)
//  2. Shopping_ads_scrape_status === 'done' மட்டும் fetch
//  3. ஒவ்வொரு product-க்கும் competitor prices find பண்ணு
//  4. lowest price, diff, status compute பண்ணு
//  5. merged rows + stats return பண்ணு
// ────────────────────────────────────────────────────────────
router.get("/list", auth, tenantResolver, async (req, res) => {
  try {
    const productsCol   = req.tenantDb.collection("products");
    const competitorCol = req.tenantDb.collection("competitor_prices");

    const {
      status,
      competitor_name,
      search,
      page  = 1,
      limit = 100,
    } = req.query;

    // ── 1. Product filter build பண்ணு ──────────────────────
    const productFilter = {
      is_active: true,
      Shopping_ads_scrape_status: "done", // ✅ done மட்டும் fetch
    };

    if (search) {
      productFilter.$or = [
        { item_code:    { $regex: search, $options: "i" } },
        { product_name: { $regex: search, $options: "i" } },
        { brand:        { $regex: search, $options: "i" } },
      ];
    }

    const skip          = (Number(page) - 1) * Number(limit);
    const totalProducts = await productsCol.countDocuments(productFilter);

    // ✅ Scrape done products இல்லன்னா early return
    if (totalProducts === 0) {
      return res.json({
        success:  true,
        total:    0,
        filtered: 0,
        page:     Number(page),
        limit:    Number(limit),
        message:  "No scrape data found",
        stats: {
          total: 0, withData: 0, expensive: 0,
          cheaper: 0, matched: 0, noData: 0, pctAdvantage: 0,
        },
        competitorNames: [],
        data: [],
      });
    }

    const products = await productsCol
      .find(productFilter, {
        projection: {
          item_code:     1,
          product_name:  1,
          brand:         1,
          category:      1,
          price:         1,
          was_price:     1,
          product_image: 1,
          product_url:   1,
        },
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    if (!products.length) {
      return res.json({
        success:  true,
        total:    0,
        filtered: 0,
        page:     Number(page),
        limit:    Number(limit),
        message:  "No scrape data found",
        stats: {
          total: 0, withData: 0, expensive: 0,
          cheaper: 0, matched: 0, noData: 0, pctAdvantage: 0,
        },
        competitorNames: [],
        data: [],
      });
    }

    // ── 2. Competitor prices fetch பண்ணு ───────────────────
    const itemCodes = products.map(p => p.item_code).filter(Boolean);

    const compFilter = {
      item_code: { $in: itemCodes },
      is_active: true,
    };

    // Competitor name filter (dropdown)
    if (competitor_name && competitor_name !== "All") {
      compFilter.competitor_name = competitor_name;
    }

    const allCompetitorDocs = await competitorCol.find(compFilter).toArray();

    // ── 3. item_code-ஆல் group பண்ணு ──────────────────────
    const compMap = {};
    for (const doc of allCompetitorDocs) {
      if (!compMap[doc.item_code]) compMap[doc.item_code] = [];
      compMap[doc.item_code].push(doc);
    }

    // ── 4. Competitor names dropdown-க்கு ──────────────────
    const allNamesFilter = { item_code: { $in: itemCodes }, is_active: true };
    const allNamesForDropdown = competitor_name && competitor_name !== "All"
      ? await competitorCol
          .find(allNamesFilter, { projection: { competitor_name: 1 } })
          .toArray()
      : allCompetitorDocs;

    const competitorNames = [
      ...new Set(allNamesForDropdown.map(d => d.competitor_name).filter(Boolean)),
    ];

    // ── 5. Merged rows build பண்ணு ─────────────────────────
    const rows = products.map(product => {
      const competitors = compMap[product.item_code] || [];
      const ourPrice    = product.price;

      if (!competitors.length) {
        return {
          item_code:           product.item_code,
          product_name:        product.product_name,
          brand:               product.brand,
          category:            product.category,
          product_image:       product.product_image,
          your_price:          ourPrice,
          your_was_price:      product.was_price,
          comp_lowest_price:   null,
          comp_highest_price:  null,
          comp_cheapest_store: null,
          price_diff:          null,
          price_diff_pct:      null,
          status:              "no_data",
          competitor_count:    0,
          competitors:         [],
        };
      }

      // Price ascending sort → index 0 = cheapest competitor
      const sorted          = [...competitors].sort((a, b) => a.competitor_price - b.competitor_price);
      const lowestComp      = sorted[0];
      const highestComp     = sorted[sorted.length - 1];
      const compLowestPrice = lowestComp.competitor_price;

      const priceDiff    = ourPrice != null ? compLowestPrice - ourPrice : null;
      const priceDiffPct = ourPrice != null
        ? parseFloat(((priceDiff / ourPrice) * 100).toFixed(2))
        : null;

      let rowStatus = "no_data";
      if (ourPrice != null && priceDiff != null) {
        const absPct = Math.abs(priceDiffPct);
        if (absPct <= 1)        rowStatus = "matched";
        else if (priceDiff < 0) rowStatus = "cheaper";
        else                    rowStatus = "expensive";
      }

      return {
        item_code:             product.item_code,
        product_name:          product.product_name,
        brand:                 product.brand,
        category:              product.category,
        product_image:         product.product_image,
        your_price:            ourPrice,
        your_was_price:        product.was_price,
        comp_lowest_price:     compLowestPrice,
        comp_highest_price:    highestComp.competitor_price,
        comp_cheapest_store:   lowestComp.competitor_name,
        price_diff:            priceDiff,
        price_diff_pct:        priceDiffPct,
        status:                rowStatus,
        competitor_count:      competitors.length,
        competitors: sorted.map(c => ({
          _id:                  c._id,
          competitor_name:      c.competitor_name,
          competitor_price:     c.competitor_price,
          competitor_was_price: c.competitor_was_price,
          competitor_url:       c.competitor_url,
          competitor_sku:       c.competitor_sku,
          price_diff:           ourPrice != null ? c.competitor_price - ourPrice : null,
          price_diff_pct:       ourPrice != null
            ? parseFloat((((c.competitor_price - ourPrice) / ourPrice) * 100).toFixed(2))
            : null,
          scraped_at:           c.scraped_at,
          source:               c.source,
        })),
      };
    });

    // ── 6. Stats → always full rows-ல இருந்து ─────────────
    const undercutAlerts = rows.filter(r => r.status === "cheaper").length;
    const weCheaper      = rows.filter(r => r.status === "expensive").length;
    const matched        = rows.filter(r => r.status === "matched").length;
    const noData         = rows.filter(r => r.status === "no_data").length;
    const withData       = rows.filter(r => r.status !== "no_data").length;
    const pctAdvantage   = withData > 0
      ? Math.round((weCheaper / withData) * 100)
      : 0;

    // ── 7. Status filter (join-க்கு பிறகு) ────────────────
    let filteredRows = rows;
    if (status && status !== "All status") {
      filteredRows = rows.filter(r => r.status === status);
    }

    return res.json({
      success:  true,
      total:    totalProducts,
      filtered: filteredRows.length,
      page:     Number(page),
      limit:    Number(limit),
      message:  filteredRows.length === 0 ? "No scrape data found" : null,
      stats: {
        total:        rows.length,
        withData,
        expensive:    undercutAlerts,
        cheaper:      weCheaper,
        matched,
        noData,
        pctAdvantage,
      },
      competitorNames,
      data: filteredRows,
    });

  } catch (err) {
    console.error("[competitor-price/list]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
