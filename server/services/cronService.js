// services/cronService.js
const cron     = require('node-cron');
const axios    = require('axios');
const mongoose = require('mongoose');
const { getTenantDb } = require('../config/db');
const ProductSchema          = require('../models/Product');
const FeedAuditProductSchema = require('../models/FeedAuditProduct');
const AuditLogSchema         = require('../models/AuditLog');
const FeedAuditIssueSchema   = require('../models/FeedAuditIssue');
const activeCrons = new Map();
// ============================================
// PROTECTED FIELDS
// — Feed refresh-ல் manually filled values
//   overwrite ஆகக்கூடாது
// ============================================
const PROTECTED_FIELDS = [
  'color', 'gender', 'age_group', 'material', 'pattern', 'brand',
  'description', 'short_description', 'ean_id', 'google_category',
  'meta_title', 'url_key', 'bl_size', 'was_price',
  'sku_variation', 'bl_upc','gtin',
  'product_highlight1', 'product_highlight2', 'product_highlight3',
  'product_highlight4', 'product_highlight5',
  'additional_image1', 'additional_image2', 'additional_image3',
  'additional_image4', 'additional_image5', 'additional_image6',
  'additional_image7', 'additional_image8',
];
// ============================================
// FIELD MAPPING
// — Feed-ல் different field names → DB field names
// ============================================
const FIELD_MAP = {
  stock:       'quantity',
  store_price: 'was_price',
  product_url: 'products_url',
};
// ============================================
// AUDIT ISSUE CACHE
// ============================================
let cachedAuditIssues = null;
async function getAuditIssues() {
  if (cachedAuditIssues) return cachedAuditIssues;
  const FeedAuditIssueModel =
    mongoose.models?.FeedAuditIssue ||
    mongoose.model('FeedAuditIssue', FeedAuditIssueSchema);
  const issues = await FeedAuditIssueModel.find({ isActive: true }).lean();
  console.log(`[AUDIT] DB: ${FeedAuditIssueModel.db.name}, found: ${issues.length}`);
  cachedAuditIssues = issues;
  console.log(`[AUDIT] ✔ Loaded ${issues.length} audit issue definitions from DB`);
  return cachedAuditIssues;
}
function clearAuditIssueCache() {
  cachedAuditIssues = null;
  console.log('[AUDIT] 🔄 Issue cache cleared — will reload on next cron run');
}
// ============================================
// GET TENANT MODELS
// ============================================
function getTenantModels(tenantId) {
  const tenantDb = getTenantDb(tenantId);
  const ProductModel =
    tenantDb.models?.Product ||
    tenantDb.model('Product', ProductSchema);
  const FeedAuditProductModel =
    tenantDb.models?.FeedAuditProduct ||
    tenantDb.model('FeedAuditProduct', FeedAuditProductSchema);
  const AuditLogModel =
    tenantDb.models?.AuditLog ||
    tenantDb.model('AuditLog', AuditLogSchema);
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
// KEYWORD LISTS
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
// SANITIZE NUMERIC FIELDS
// — Feed-ல் "test", "", null போன்ற invalid values
//   Mongoose Number cast error தராம null-ஆ மாத்திடும்
// ============================================
const NUMERIC_FIELDS = ['was_price', 'price', 'sale_price', 'quantity'];

function sanitizeNumericFields(product) {
  for (const field of NUMERIC_FIELDS) {
    if (product[field] !== undefined) {
      const parsed = parseFloat(product[field]);
      product[field] = isNaN(parsed) ? null : parsed;
    }
  }
  return product;
}
// ============================================
// HELPERS
// ============================================
function isEmpty(value) {
  return (
    value === null      ||
    value === undefined ||
    value === ''        ||
    (Array.isArray(value) && value.length === 0)
  );
}
function capitalize(word) {
  if (!word) return null;
  return word.charAt(0).toUpperCase() + word.slice(1);
}
function extractFromTitle(title, keywords) {
  if (!title) return null;
  const lower = title.toLowerCase();
  const found = keywords.find(word => lower.includes(word));
  return found ? capitalize(found) : null;
}
// ============================================
// TITLE ENRICHMENT
// ============================================
function enrichProductFromTitle(product) {
  const title = product.product_name || '';
  if (isEmpty(product.color)) {
    const extracted = extractFromTitle(title, COLOR_KEYWORDS);
    if (extracted) {
      product.color = extracted;
      console.log(`[ENRICH] color → "${extracted}" (from title)`);
    }
  }
  if (isEmpty(product.gender)) {
    const extracted = extractFromTitle(title, GENDER_KEYWORDS);
    if (extracted) {
      product.gender = extracted;
      console.log(`[ENRICH] gender → "${extracted}" (from title)`);
    }
  }
  if (isEmpty(product.material)) {
    const extracted = extractFromTitle(title, MATERIAL_KEYWORDS);
    if (extracted) {
      product.material = extracted;
      console.log(`[ENRICH] material → "${extracted}" (from title)`);
    }
  }
  if (isEmpty(product.pattern)) {
    const extracted = extractFromTitle(title, PATTERN_KEYWORDS);
    if (extracted) {
      product.pattern = extracted;
      console.log(`[ENRICH] pattern → "${extracted}" (from title)`);
    }
  }
  if (isEmpty(product.age_group)) {
    const extracted = extractFromTitle(title, AGE_GROUP_KEYWORDS);
    if (extracted) {
      product.age_group = extracted;
      console.log(`[ENRICH] age_group → "${extracted}" (from title)`);
    }
  }
  return product;
}
// ============================================
// AUDIT FUNCTION
// ============================================
function auditProduct(product, auditIssues) {
  const issues = [];
  const title  = product.product_name || '';
  for (const issueDef of auditIssues) {
    const { field, label, priority, status } = issueDef;
    if (field === 'brand_in_title') {
      if (
        !isEmpty(product.brand) &&
        !isEmpty(title) &&
        !title.toLowerCase().includes(product.brand.toLowerCase())
      ) {
        issues.push({ field, label, priority, status });
      }
      continue;
    }
    if (field === 'proper_casing') {
      if (!isEmpty(title)) {
        const isAllCaps  = title === title.toUpperCase();
        const isAllLower = title === title.toLowerCase();
        if (isAllCaps || isAllLower) {
          issues.push({ field, label, priority, status });
        }
      }
      continue;
    }
    if (isEmpty(product[field])) {
      issues.push({ field, label, priority, status });
    }
  }
  const totalChecks = auditIssues.length;
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
// SAVE AUDIT RESULT
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
    // Step 3: Get tenant models
    const { ProductModel, FeedAuditProductModel, AuditLogModel } = getTenantModels(tenantId);
    // Step 4: Load audit issues (cached)
    const auditIssues = await getAuditIssues();
    console.log(`[CRON] ✔ Using ${auditIssues.length} audit issue definitions`);
    // Step 5: Mark all existing products inactive
    await ProductModel.updateMany(
      { tenantId },
      { $set: { is_active: false, deactivatedAt: new Date() } }
    );
    console.log(`[CRON] ✔ Marked all products inactive for tenant: ${tenantId}`);
    let newCount       = 0;
    let updatedCount   = 0;
    let unchangedCount = 0;
    let enrichedCount  = 0;
    let auditSummary   = { high: 0, medium: 0, low: 0, others: 0 };
    // Step 6: Process each product
    for (const rawProduct of products) {
      const uniqueId = rawProduct.item_code || rawProduct.ean_id || rawProduct.id;
      if (!uniqueId) continue;

      // ─── STEP 6a: Field mapping (feed → DB) ──────────────
      // Different feeds use different field names — normalize them
      // e.g. stock → quantity, store_price → was_price
      for (const [feedField, dbField] of Object.entries(FIELD_MAP)) {
        if (rawProduct[feedField] !== undefined && rawProduct[dbField] === undefined) {
          rawProduct[dbField] = rawProduct[feedField];
          delete rawProduct[feedField];
          console.log(`[MAP] ${feedField} → ${dbField}: "${rawProduct[dbField]}" for ${uniqueId}`);
        }
      }

      // ─── STEP 6b: Sanitize numeric fields ────────────────
      // Feed-ல் "test", "", null போன்ற invalid values
      // Mongoose Number cast error தராம null-ஆ மாத்திடும்
      sanitizeNumericFields(rawProduct);

      // ─── STEP 6c: Enrich from title ──────────────────────
      const before = JSON.stringify({
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
      // ─── STEP 6d: Protect manually filled values ─────────
      // DB-ல் existing product-ல் manually filled values
      // feed refresh-ல் overwrite ஆகக்கூடாது
      const existing = await ProductModel.findOne(
        { sourceId: String(uniqueId) },
        PROTECTED_FIELDS.join(' ')
      ).lean();
      if (existing) {
        for (const field of PROTECTED_FIELDS) {
          // Feed-ல் empty, DB-ல் value இருக்கு → DB value keep
          if (isEmpty(product[field]) && !isEmpty(existing[field])) {
            product[field] = existing[field];
            console.log(`[PROTECT] ${field} → kept DB value "${existing[field]}" for ${uniqueId}`);
          }
        }
      }
      // ─── STEP 6e: Upsert product to DB ───────────────────
      const result = await ProductModel.updateOne(
        { sourceId: String(uniqueId) },
        {
          $set: {
            ...product,
            gtin:          rawProduct.gtin || null,
            products_url:  rawProduct.products_url || rawProduct.product_url || null,
            sourceId:      String(uniqueId),
            feedId:        String(feed._id),
            tenantId:      tenantId,
            is_active:     true,
            deactivatedAt: null,
            updatedAt:     new Date(),
            field_optimization_status: 'pending',
          },
          $setOnInsert: { importedAt: new Date() },
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
      // ─── STEP 6f: Audit enriched product ─────────────────
      const auditResult = auditProduct(product, auditIssues);
      await saveAuditResult(FeedAuditProductModel, product, auditResult);
      auditSummary.high   += auditResult.summary.high;
      auditSummary.medium += auditResult.summary.medium;
      auditSummary.low    += auditResult.summary.low;
      auditSummary.others += auditResult.summary.others;
    }
    // Step 7: Count inactive products
    const inactiveCount = await ProductModel.countDocuments({
      tenantId,
      is_active: false,
    });
    console.log(`[CRON] ✔ Import done:`);
    console.log(`        🆕 New:        ${newCount}`);
    console.log(`        ✏️  Updated:    ${updatedCount}`);
    console.log(`        ✅ Unchanged:   ${unchangedCount}`);
    console.log(`        💤 Inactive:   ${inactiveCount}`);
    console.log(`        🔍 Enriched:   ${enrichedCount}`);
    console.log(`        🛡️  Protected:  manually filled values kept`);
    console.log(`[CRON] ✔ Audit — High: ${auditSummary.high}, Medium: ${auditSummary.medium}, Low: ${auditSummary.low}, Others: ${auditSummary.others}`);
    // Step 8: Save import log
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
    const merchants = await mongoose.connection
      .collection('merchants')
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
  clearAuditIssueCache,
};
