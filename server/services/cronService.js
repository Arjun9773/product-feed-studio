// services/cronService.js
const cron     = require('node-cron');
const axios    = require('axios');
const mongoose = require('mongoose');
const { getMainDb, getTenantDb } = require('../config/db');

// ─── SCHEMAS ─────────────────────────────────────────────────
const ProductSchema          = require('../models/Product');
const FeedAuditProductSchema = require('../models/FeedAuditProduct');
const AuditLogSchema         = require('../models/AuditLog');

const activeCrons = new Map();

// ============================================
// GET TENANT MODELS (schema-aware, per tenant)
// ============================================
function getTenantModels(tenantId) {
  const tenantDb = getTenantDb(tenantId);

  const ProductModel = tenantDb.models?.Product
    || tenantDb.model('Product', ProductSchema);

  const FeedAuditProductModel = tenantDb.models?.FeedAuditProduct
    || tenantDb.model('FeedAuditProduct', FeedAuditProductSchema);

  const AuditLogModel = tenantDb.models?.AuditLog
    || tenantDb.model('AuditLog', AuditLogSchema);

  return { ProductModel, FeedAuditProductModel, AuditLogModel, tenantDb };
}

// ============================================
// BUILD CRON EXPRESSION
// ============================================
function buildCronExpression(schedule, scheduleTime) {
  const [hour, minute] = (scheduleTime || '06:00').split(':');

  switch (schedule) {
    case 'Hourly':  return `${minute} * * * *`;
    case 'Daily':   return `${minute} ${hour} * * *`;
    case 'Weekly':  return `${minute} ${hour} * * 0`;
    case 'Monthly': return `${minute} ${hour} 1 * *`;
    default:        return `${minute} ${hour} * * *`;
  }
}

// ============================================
// KEYWORD LISTS — for title extraction
// ============================================
const COLOR_KEYWORDS = [
  'red','blue','green','black','white','silver','gold',
  'grey','gray','pink','yellow','orange','purple','brown',
  'copper','bronze','chrome','beige','cream','navy','violet'
];

const MATERIAL_KEYWORDS = [
  'plastic','metal','steel','aluminium','aluminum','glass',
  'wood','leather','fabric','rubber','copper','iron','alloy',
  'stainless','ceramic','silicone','fiber','carbon'
];

const PATTERN_KEYWORDS = [
  'solid','striped','floral','checked','printed','plain',
  'dotted','geometric','abstract','camouflage','textured'
];

const AGE_GROUP_KEYWORDS = [
  'adult','adults','kids','kid','children','child',
  'baby','babies','infant','toddler','toddlers',
  'teen','teens','teenager','senior','seniors','newborn',
  'boys','boy','girls','girl',
  '0-3','3-6','6-12','1-3','2-4','3-5',
  '5-7','6-8','8-10','10-12','12-14','14-16'
];

const GENDER_KEYWORDS = [
  'men','man','male',
  'women','woman','female',
  'boys','boy','girls','girl',
  'unisex','kids','children'
];

// ============================================
// HELPERS
// ============================================

// Check if value is empty
function isEmpty(value) {
  return (
    value === null      ||
    value === undefined ||
    value === ''        ||
    (Array.isArray(value) && value.length === 0)
  );
}

// Capitalize first letter
function capitalize(word) {
  if (!word) return null;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Find keyword in title and return it
function extractFromTitle(title, keywords) {
  if (!title) return null;
  const lower = title.toLowerCase();
  const found = keywords.find(word => lower.includes(word));
  return found ? capitalize(found) : null;
}

// ============================================
// TITLE ENRICHMENT
// — If field is empty, extract from title
// — If found in title, save that value to DB
// ============================================
function enrichProductFromTitle(product) {
  const title = product.product_name || '';

  // Color
  if (isEmpty(product.color)) {
    const extracted = extractFromTitle(title, COLOR_KEYWORDS);
    if (extracted) {
      product.color = extracted;
      console.log(`[ENRICH] color → "${extracted}" (from title)`);
    }
  }

  // Gender
  if (isEmpty(product.gender)) {
    const extracted = extractFromTitle(title, GENDER_KEYWORDS);
    if (extracted) {
      product.gender = extracted;
      console.log(`[ENRICH] gender → "${extracted}" (from title)`);
    }
  }

  // Material
  if (isEmpty(product.material)) {
    const extracted = extractFromTitle(title, MATERIAL_KEYWORDS);
    if (extracted) {
      product.material = extracted;
      console.log(`[ENRICH] material → "${extracted}" (from title)`);
    }
  }

  // Pattern
  if (isEmpty(product.pattern)) {
    const extracted = extractFromTitle(title, PATTERN_KEYWORDS);
    if (extracted) {
      product.pattern = extracted;
      console.log(`[ENRICH] pattern → "${extracted}" (from title)`);
    }
  }

  // Age Group
  if (isEmpty(product.age_group)) {
    const extracted = extractFromTitle(title, AGE_GROUP_KEYWORDS);
    if (extracted) {
      product.age_group = extracted;
      console.log(`[ENRICH] age_group → "${extracted}" (from title)`);
    }
  }

  return product; // enriched product return பண்ணும்
}

// ============================================
// AUDIT FUNCTION
//
// Priority: High    →  7 checks  (checks 1–7)
// Priority: Medium  →  4 checks  (checks 8–11)
// Priority: Low     →  1 check   (check  12)
// Priority: Others  → 20 checks  (checks 13–32)
// Total             → 32 checks
//
// NOTE: enrichProductFromTitle() already ran before
// this — so if title had color, product.color is set.
// Audit just checks if value exists after enrichment.
// ============================================
function auditProduct(product) {
  const issues = [];
  const title  = product.product_name || '';

  // ─── HIGH PRIORITY ───────────────────────────────────────

  // 1. No Colour
  if (isEmpty(product.color)) {
    issues.push({ field: 'color', label: 'No Colour', priority: 'high', status: 'missing' });
  }

  // 2. No Age Group
  if (isEmpty(product.age_group)) {
    issues.push({ field: 'age_group', label: 'No Age Group', priority: 'high', status: 'missing' });
  }

  // 3. No Gender
  if (isEmpty(product.gender)) {
    issues.push({ field: 'gender', label: 'No Gender', priority: 'high', status: 'missing' });
  }

  // 4. No Material
  if (isEmpty(product.material)) {
    issues.push({ field: 'material', label: 'No Material', priority: 'high', status: 'missing' });
  }

  // 5. Brand not in title
  if (
    !isEmpty(product.brand) &&
    !isEmpty(title) &&
    !title.toLowerCase().includes(product.brand.toLowerCase())
  ) {
    issues.push({ field: 'product_name', label: 'Brand not in title', priority: 'high', status: 'issue' });
  }

  // 6. No Google Category
  if (isEmpty(product.google_category)) {
    issues.push({ field: 'google_category', label: 'No Google Category', priority: 'high', status: 'missing' });
  }

  // 7. No Brand
  if (isEmpty(product.brand)) {
    issues.push({ field: 'brand', label: 'No Brand', priority: 'high', status: 'missing' });
  }

  // ─── MEDIUM PRIORITY ─────────────────────────────────────

  // 8. No Pattern
  if (isEmpty(product.pattern)) {
    issues.push({ field: 'pattern', label: 'No Pattern', priority: 'medium', status: 'missing' });
  }

  // 9. Proper Casing
  if (!isEmpty(title)) {
    const isAllCaps  = title === title.toUpperCase();
    const isAllLower = title === title.toLowerCase();
    if (isAllCaps || isAllLower) {
      issues.push({ field: 'product_name', label: 'Proper casing', priority: 'medium', status: 'issue' });
    }
  }

  // 10. No Description
  if (isEmpty(product.description)) {
    issues.push({ field: 'description', label: 'No Description', priority: 'medium', status: 'missing' });
  }

  // 11. No Short Description
  if (isEmpty(product.short_description)) {
    issues.push({ field: 'short_description', label: 'No Short Description', priority: 'medium', status: 'missing' });
  }

  // ─── LOW PRIORITY ────────────────────────────────────────

  // 12. No GTIN
  if (isEmpty(product.ean_id)) {
    issues.push({ field: 'ean_id', label: 'No GTIN', priority: 'low', status: 'missing' });
  }

  // ─── OTHERS PRIORITY ─────────────────────────────────────

  // 13. No URL Key
  if (isEmpty(product.url_key)) {
    issues.push({ field: 'url_key', label: 'No Url Key', priority: 'others', status: 'missing' });
  }

  // 14. No Meta Title
  if (isEmpty(product.meta_title)) {
    issues.push({ field: 'meta_title', label: 'No Meta Tittle', priority: 'others', status: 'missing' });
  }

  // 15. No BL Size
  if (isEmpty(product.bl_size)) {
    issues.push({ field: 'bl_size', label: 'No Bl Size', priority: 'others', status: 'missing' });
  }

  // 16. No Quantity
  if (isEmpty(product.quantity)) {
    issues.push({ field: 'quantity', label: 'No Quantity', priority: 'others', status: 'missing' });
  }

  // 17. No Was Price
  if (isEmpty(product.was_price)) {
    issues.push({ field: 'was_price', label: 'No Was Price', priority: 'others', status: 'missing' });
  }

  // 18. No Sku Variation
  if (isEmpty(product.sku_variation)) {
    issues.push({ field: 'sku_variation', label: 'No Sku Variation', priority: 'others', status: 'missing' });
  }

  // 19. No BL UPC
  if (isEmpty(product.bl_upc)) {
    issues.push({ field: 'bl_upc', label: 'No Bl Upc', priority: 'others', status: 'missing' });
  }

  // 20. No Product Highlight 1
  if (isEmpty(product.product_highlight1)) {
    issues.push({ field: 'product_highlight1', label: 'No Product Highlight1', priority: 'others', status: 'missing' });
  }

  // 21. No Product Highlight 2
  if (isEmpty(product.product_highlight2)) {
    issues.push({ field: 'product_highlight2', label: 'No Product Highlight2', priority: 'others', status: 'missing' });
  }

  // 22. No Product Highlight 3
  if (isEmpty(product.product_highlight3)) {
    issues.push({ field: 'product_highlight3', label: 'No Product Highlight3', priority: 'others', status: 'missing' });
  }

  // 23. No Product Highlight 4
  if (isEmpty(product.product_highlight4)) {
    issues.push({ field: 'product_highlight4', label: 'No Product Highlight4', priority: 'others', status: 'missing' });
  }

  // 24. No Product Highlight 5
  if (isEmpty(product.product_highlight5)) {
    issues.push({ field: 'product_highlight5', label: 'No Product Highlight5', priority: 'others', status: 'missing' });
  }

  // 25. No Additional Image 1
  if (isEmpty(product.additional_image1)) {
    issues.push({ field: 'additional_image1', label: 'No Additional Image1', priority: 'others', status: 'missing' });
  }

  // 26. No Additional Image 2
  if (isEmpty(product.additional_image2)) {
    issues.push({ field: 'additional_image2', label: 'No Additional Image2', priority: 'others', status: 'missing' });
  }

  // 27. No Additional Image 3
  if (isEmpty(product.additional_image3)) {
    issues.push({ field: 'additional_image3', label: 'No Additional Image3', priority: 'others', status: 'missing' });
  }

  // 28. No Additional Image 4
  if (isEmpty(product.additional_image4)) {
    issues.push({ field: 'additional_image4', label: 'No Additional Image4', priority: 'others', status: 'missing' });
  }

  // 29. No Additional Image 5
  if (isEmpty(product.additional_image5)) {
    issues.push({ field: 'additional_image5', label: 'No Additional Image5', priority: 'others', status: 'missing' });
  }

  // 30. No Additional Image 6
  if (isEmpty(product.additional_image6)) {
    issues.push({ field: 'additional_image6', label: 'No Additional Image6', priority: 'others', status: 'missing' });
  }

  // 31. No Additional Image 7
  if (isEmpty(product.additional_image7)) {
    issues.push({ field: 'additional_image7', label: 'No Additional Image7', priority: 'others', status: 'missing' });
  }

  // 32. No Additional Image 8
  if (isEmpty(product.additional_image8)) {
    issues.push({ field: 'additional_image8', label: 'No Additional Image8', priority: 'others', status: 'missing' });
  }

  // ─── SCORE (out of 32 checks) ─────────────────────────────
  const totalChecks = 32;
  const score = Math.round(((totalChecks - issues.length) / totalChecks) * 100);

  return {
    issues,
    score,
    summary: {
      high:   issues.filter(i => i.priority === 'high').length,
      medium: issues.filter(i => i.priority === 'medium').length,
      low:    issues.filter(i => i.priority === 'low').length,
      others: issues.filter(i => i.priority === 'others').length,
    },
  };
}

// ============================================
// SAVE AUDIT TO feed_audit_products
// ============================================
async function saveAuditResult(FeedAuditProductModel, product, auditResult) {
  await FeedAuditProductModel.updateOne(
    { sourceId: String(product.item_code || product.ean_id) },
    {
      $set: {
        sourceId:     String(product.item_code || product.ean_id),
        product_name: product.product_name,
        brand:        product.brand,
        category:     product.category,
        issues:       auditResult.issues,
        score:        auditResult.score,
        summary:      auditResult.summary,
        updatedAt:    new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

// ============================================
// FETCH PRODUCTS + AUDIT
// ============================================
async function importFeedForTenant(tenantId, feed) {
  try {
    console.log(`[CRON] ▶ Starting import — tenant: ${tenantId}, feed: ${feed.feedName}`);

    // Step 1: Fetch products from URL
    const response = await axios.get(feed.importUrl, { timeout: 30000 });
    const data     = response.data;

    // Step 2: Normalize to array
    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (data.items && Array.isArray(data.items)) {
      products = data.items;
    } else {
      console.log(`[CRON] ⚠ Unknown data format for tenant: ${tenantId}`);
      return;
    }

    console.log(`[CRON] ✔ Fetched ${products.length} products for tenant: ${tenantId}`);

    // Step 3: Get schema-aware tenant models
    const { ProductModel, FeedAuditProductModel, AuditLogModel } = getTenantModels(tenantId);

    // Step 4: Mark ALL existing products inactive before import
    await ProductModel.updateMany(
      { tenantId },
      {
        $set: {
          is_active:     false,
          deactivatedAt: new Date(),
        },
      }
    );
    console.log(`[CRON] ✔ Marked all products inactive for tenant: ${tenantId}`);

    let newCount       = 0;
    let updatedCount   = 0;
    let unchangedCount = 0;
    let enrichedCount  = 0;
    let auditSummary   = { high: 0, medium: 0, low: 0, others: 0 };

    // Step 5: Process each product
    for (const rawProduct of products) {
      const uniqueId = rawProduct.item_code || rawProduct.ean_id || rawProduct.id;
      if (!uniqueId) continue;

      // ─── STEP 5a: Enrich from title ──────────────────────
      // If color/gender/material/pattern/age_group is empty,
      // extract from product title and save actual value to DB
      const before  = JSON.stringify({
        color:     rawProduct.color,
        gender:    rawProduct.gender,
        material:  rawProduct.material,
        pattern:   rawProduct.pattern,
        age_group: rawProduct.age_group,
      });

      const product = enrichProductFromTitle(rawProduct);

      const after = JSON.stringify({
        color:     product.color,
        gender:    product.gender,
        material:  product.material,
        pattern:   product.pattern,
        age_group: product.age_group,
      });

      if (before !== after) enrichedCount++;
      // ─────────────────────────────────────────────────────

      // ─── STEP 5b: Upsert enriched product to DB ──────────
      const result = await ProductModel.updateOne(
        { sourceId: String(uniqueId) },
        {
          $set: {
            ...product,        // ← enriched product (color filled from title)
            sourceId:      String(uniqueId),
            feedId:        String(feed._id),
            tenantId:      tenantId,
            is_active:     true,
            deactivatedAt: null,
            updatedAt:     new Date(),
          },
          $setOnInsert: {
            importedAt: new Date(),
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        newCount++;
      } else if (result.modifiedCount > 0) {
        updatedCount++;
      } else {
        unchangedCount++;
      }

      // ─── STEP 5c: Audit enriched product ─────────────────
      // Audit runs AFTER enrichment — so if title had color,
      // product.color is now set → No Colour issue won't appear
      const auditResult = auditProduct(product);
      await saveAuditResult(FeedAuditProductModel, product, auditResult);

      auditSummary.high   += auditResult.summary.high;
      auditSummary.medium += auditResult.summary.medium;
      auditSummary.low    += auditResult.summary.low;
      auditSummary.others += auditResult.summary.others;
    }

    // Step 6: Count inactive products (removed from feed)
    const inactiveCount = await ProductModel.countDocuments({
      tenantId,
      is_active: false,
    });

    console.log(`[CRON] ✔ Import done:`);
    console.log(`        🆕 New:        ${newCount}`);
    console.log(`        ✏️  Updated:    ${updatedCount}`);
    console.log(`        ✅ Unchanged:   ${unchangedCount}`);
    console.log(`        💤 Inactive:   ${inactiveCount}`);
    console.log(`        🔍 Enriched:   ${enrichedCount} (title-லிருந்து values filled)`);
    console.log(`[CRON] ✔ Audit — High: ${auditSummary.high}, Medium: ${auditSummary.medium}, Low: ${auditSummary.low}, Others: ${auditSummary.others}`);

    // Step 7: Save import log
    await AuditLogModel.create({
      action:            'feed_import',
      feedId:            String(feed._id),
      feedName:          feed.feedName,
      totalProducts:     products.length,
      newProducts:       newCount,
      updatedProducts:   updatedCount,
      unchangedProducts: unchangedCount,
      inactiveProducts:  inactiveCount,
      enrichedProducts:  enrichedCount,
      auditSummary:      auditSummary,
      importedAt:        new Date(),
    });

  } catch (error) {
    console.error(`[CRON] ✖ Error for tenant ${tenantId}:`, error.message);
  }
}

// ============================================
// REGISTER CRON FOR ONE TENANT
// ============================================
function registerFeedCron(tenantId, feed) {
  const key = `${tenantId}_${feed._id}`;

  if (activeCrons.has(key)) {
    activeCrons.get(key).stop();
    console.log(`[CRON] ↺ Restarting cron for tenant: ${tenantId}`);
  }

  const cronExpr = buildCronExpression(feed.schedule, feed.scheduleTime);

  if (!cron.validate(cronExpr)) {
    console.error(`[CRON] ✖ Invalid cron expression: ${cronExpr}`);
    return;
  }

  const job = cron.schedule(cronExpr, () => {
    console.log(`[CRON] ⏰ Triggered for tenant: ${tenantId}`);
    importFeedForTenant(tenantId, feed);
  });

  activeCrons.set(key, job);
  console.log(`[CRON] ✔ Registered — tenant: ${tenantId}, expression: "${cronExpr}"`);
}

// ============================================
// INIT ALL CRONS ON SERVER START
// ============================================
async function initAllCrons() {
  try {
    console.log('[CRON] 🚀 Initializing all cron jobs...');

    const mainDb    = getMainDb();
    const merchants = await mainDb.collection('merchants')
      .find({ status: 'active' })
      .toArray();

    console.log(`[CRON] Found ${merchants.length} merchants`);

    for (const merchant of merchants) {
      const tenantId = merchant.storeId;
      const feedInfo = merchant.feed_info;

      if (!tenantId || !feedInfo?.feed_url || !feedInfo?.schedule_info) {
        console.log(`[CRON] ⚠ Skipping: ${tenantId} — missing feed config`);
        continue;
      }

      registerFeedCron(tenantId, {
        _id:          merchant._id,
        feedName:     feedInfo.feed_name || tenantId,
        importUrl:    feedInfo.feed_url,
        schedule:     feedInfo.schedule_info,
        scheduleTime: feedInfo.import_time,
      });
    }

    console.log(`[CRON] ✔ Total jobs initialized: ${activeCrons.size}`);
  } catch (error) {
    console.error('[CRON] ✖ Initialization error:', error.message);
  }
}

// ============================================
// GET CRON STATUS
// ============================================
function getCronStatus() {
  const status = [];

  for (const [key, job] of activeCrons.entries()) {
    const [tenantId, feedId] = key.split('_');
    status.push({
      key,
      tenantId,
      feedId,
      running: job.options?.scheduled ?? true,
    });
  }

  return {
    totalJobs: activeCrons.size,
    jobs:      status,
    checkedAt: new Date(),
  };
}

module.exports = {
  initAllCrons,
  registerFeedCron,
  getCronStatus,
  importFeedForTenant,
};
