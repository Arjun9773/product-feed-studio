const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const { getTenantDb } = require('../config/db');

const activeCrons = new Map();

// Builds cron expression from schedule type and time
// Example: Daily + 06:00 → "0 6 * * *"
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

// Fetches products from feed URL and upserts into tenant DB
async function importFeedForTenant(tenantId, feed) {
  try {
    console.log(`[CRON] Starting import for tenant: ${tenantId}, feed: ${feed.feedName}`);

    // Step 1: Fetch data from the feed URL
    const response = await axios.get(feed.importUrl, { timeout: 30000 });
    const data = response.data;

    // Step 2: Normalize to array — handles JSON array, Shopify, and generic formats
    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (data.items && Array.isArray(data.items)) {
      products = data.items;
    } else {
      console.log(`[CRON] Unknown data format for tenant ${tenantId}`);
      return;
    }

    // Step 3: Get tenant DB and collections
    const tenantDb = getTenantDb(tenantId);
    const productsCollection = tenantDb.collection('products');
    const auditCollection = tenantDb.collection('audit');

    let newCount = 0;
    let updatedCount = 0;

    // Step 4: Upsert each product — insert if new, update if exists
    for (const product of products) {
      const uniqueId = product.id || product.sku || product.handle || product.product_id;
      if (!uniqueId) continue;

      const result = await productsCollection.updateOne(
        { sourceId: String(uniqueId) },
        {
          $set: {
            ...product,             // Always update with latest data (price, description, etc.)
            sourceId:  String(uniqueId),
            feedId:    String(feed._id),
            tenantId:  tenantId,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            importedAt: new Date(), // Only set when first inserted
          }
        },
        { upsert: true }
      );

      // upsertedCount = 1 means new product inserted
      if (result.upsertedCount > 0) {
        newCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`[CRON] Tenant: ${tenantId} — New: ${newCount}, Updated: ${updatedCount}`);

    // Step 5: Save audit log for this import run
    await auditCollection.insertOne({
      action:         'feed_import',
      feedId:         String(feed._id),
      feedName:       feed.feedName,
      newProducts:    newCount,
      updatedProducts: updatedCount,
      importedAt:     new Date(),
    });

  } catch (error) {
    console.error(`[CRON] Error for tenant ${tenantId}:`, error.message);
  }
}

// Registers a cron job for a single feed
// Called when: server starts OR user saves feed config
function registerFeedCron(tenantId, feed) {
  const key = `${tenantId}_${feed._id}`;

  // Stop existing job before registering new one
  if (activeCrons.has(key)) {
    activeCrons.get(key).stop();
  }

  const cronExpr = buildCronExpression(feed.schedule, feed.scheduleTime);

  if (!cron.validate(cronExpr)) {
    console.error(`[CRON] Invalid cron expression: ${cronExpr}`);
    return;
  }

  const job = cron.schedule(cronExpr, () => {
    importFeedForTenant(tenantId, feed);
  });

  activeCrons.set(key, job);
  console.log(`[CRON] Registered: tenant=${tenantId}, expression="${cronExpr}"`);
}

// Loads all companies from gmc_admin_companies and registers cron jobs on server start
async function initAllCrons() {
  try {
    // Step 1: Read from gmc_admin_companies collection directly
    const mainDb = mongoose.connection.useDb('gmc_main_admin_db');
    const companies = await mainDb.collection('gmc_admin_companies')
      .find({ role: 'store_admin' })
      .toArray();

    // Step 2: For each company, check if feed_info has URL and schedule
    for (const company of companies) {
      const tenantId = company.store_id; 
      const feedInfo = company.feed_info;

      if (!tenantId || !feedInfo?.feed_url || !feedInfo?.schedule_info) continue;

      // Map feed_info fields to registerFeedCron expected format
      registerFeedCron(tenantId, {
        _id:          company._id,
        feedName:     company.shopName,
        importUrl:    feedInfo.feed_url,
        schedule:     feedInfo.schedule_info,
        scheduleTime: feedInfo.import_time,
      });
    }

    console.log(`[CRON] Total jobs initialized: ${activeCrons.size}`);
  } catch (error) {
    console.error('[CRON] Initialization error:', error.message);
  }
}

module.exports = { initAllCrons, registerFeedCron };