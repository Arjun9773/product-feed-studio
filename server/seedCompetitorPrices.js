/**
 * seedCompetitorPrices.js
 *
 * Tenant-aware seed script — competitor_prices collection-ல் data போடும்.
 *
 * Usage:
 *   node seedCompetitorPrices.js
 *
 * Optional:
 *   TENANT_DB=_info_sathya node seedCompetitorPrices.js
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
const TENANT_DB = process.env.TENANT_DB || "_info_sathya";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function computeStatus(ourPrice, compPrice) {
  const diff = compPrice - ourPrice;
  const pct = Math.abs(diff) / ourPrice;
  if (pct <= 0.01) return "match";
  return diff < 0 ? "expensive" : "cheaper";
}

function makeRecord(item_code, ourPrice, competitor) {
  const diff = competitor.price - ourPrice;
  const diffPct = parseFloat(((diff / ourPrice) * 100).toFixed(2));
  return {
    item_code,
    competitor_name: competitor.name,
    competitor_price: competitor.price,
    competitor_was_price: competitor.was_price || null,
    competitor_url: competitor.url || null,
    competitor_sku: competitor.sku || null,
    price_diff: diff,
    price_diff_pct: diffPct,
    status: computeStatus(ourPrice, competitor.price),
    scraped_at: new Date(),
    source: "manual",
    is_active: true,
  };
}

// ─────────────────────────────────────────────────────────────
// Seed Data
// ─────────────────────────────────────────────────────────────

const seedData = [
  {
    item_code: "ACEXL11DMIXGARPHGREY",
    ourPrice: 20060,
    competitors: [
      {
        name: "Croma",
        price: 18990,
        was_price: null,
        url: "https://www.croma.com/whirlpool-11-kg-5-star-semi-automatic-washing-machine-with-dynamix-detergent-dispenser-ace-xl-30344-grey-/p/315294",
        sku: "315294",
      },
    ],
  },
  {
    item_code: "APMBPROM51TBSIMDE54",
    ourPrice: 189900,
    competitors: [
      {
        name: "Croma",
        price: 189900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-pro-14-2-inch-m5-16gb-1tb-macos-silver-/p/318771",
        sku: "318771",
      },
    ],
  },
  {
    item_code: "APMBNEOA18512CRMHFE4",
    ourPrice: 79899,
    competitors: [
      {
        name: "Croma",
        price: 79900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-neo-13-inch-a18-pro-8gb-512gb-macos-citrus-/p/318782",
        sku: "318782",
      },
    ],
  },
  {
    item_code: "APMBNEOA18512SIMHFC4",
    ourPrice: 79899,
    competitors: [
      {
        name: "Croma",
        price: 78900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-neo-13-inch-a18-pro-8gb-512gb-macos-silver-/p/318780",
        sku: "318780",
      },
    ],
  },
  {
    item_code: "APMBNEOA18512IGMHFG4",
    ourPrice: 79899,
    competitors: [
      {
        name: "Croma",
        price: 79900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-neo-13-inch-a18-pro-8gb-512gb-macos-indigo-/p/318784",
        sku: "318784",
      },
    ],
  },
  {
    item_code: "APMBAIRM5512MTMDHE4",
    ourPrice: 119900,
    competitors: [
      {
        name: "Croma",
        price: 119900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-air-13-6-inch-m5-16gb-512gb-macos-tahoe-midnight-/p/314193",
        sku: "314193",
      },
    ],
  },
  {
    item_code: "APMBAIRM5512SBMDHH4",
    ourPrice: 119900,
    competitors: [
      {
        name: "Croma",
        price: 119900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-air-13-6-inch-m5-16gb-512gb-macos-tahoe-sky-blue-/p/314207",
        sku: "314207",
      },
    ],
  },
  {
    item_code: "APMBAIRM5512SIMDH74",
    ourPrice: 119900,
    competitors: [
      {
        name: "Croma",
        price: 119900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-air-13-6-inch-m5-16gb-512gb-macos-tahoe-silver-/p/314116",
        sku: "314116",
      },
    ],
  },
  {
    item_code: "SMI4IKS00I",
    ourPrice: 69749,
    competitors: [
      {
        name: "Croma",
        price: 65800,
        was_price: null,
        url: "https://www.croma.com/bosch-series-4-14-place-settings-built-in-smart-dishwasher-with-ecosilence-drive-no-pre-rinse-required-white-/p/319536",
        sku: "319536",
      },
    ],
  },
  {
    item_code: "APMBAIRM5512STMDHA4",
    ourPrice: 119900,
    competitors: [
      {
        name: "Croma",
        price: 119900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-air-13-6-inch-m5-16gb-512gb-macos-tahoe-starlight-/p/314134",
        sku: "314134",
      },
    ],
  },
  {
    item_code: "APMBNEOA18256BSMHFH4",
    ourPrice: 69900,
    competitors: [
      {
        name: "Croma",
        price: 69900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-neo-13-inch-a18-pro-8gb-256gb-macos-blush-/p/318785",
        sku: "318785",
      },
    ],
  },
  {
    item_code: "APMBNEOA18256CRMHFD4",
    ourPrice: 69900,
    competitors: [
      {
        name: "Croma",
        price: 69900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-neo-13-inch-a18-pro-8gb-256gb-macos-citrus-/p/318781",
        sku: "318781",
      },
    ],
  },
  {
    item_code: "APMBNEOA18256SIMHFA4",
    ourPrice: 69900,
    competitors: [
      {
        name: "Croma",
        price: 68900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-neo-13-inch-a18-pro-8gb-256gb-macos-silver-/p/318779",
        sku: "318779",
      },
    ],
  },
  {
    item_code: "APMBNEOA18512BSMHFJ4",
    ourPrice: 79899,
    competitors: [
      {
        name: "Croma",
        price: 79900,
        was_price: null,
        url: "https://www.croma.com/apple-macbook-neo-13-inch-a18-pro-8gb-512gb-macos-blush-/p/318786",
        sku: "318786",
      },
    ],
  },
  {
    item_code: "QA83S90F",
    ourPrice: 486989,
    competitors: [
      {
        name: "Croma",
        price: 405594,
        was_price: null,
        url: "https://www.croma.com/samsung-s90f-210-cm-83-inch-4k-ultra-hd-oled-smart-tizen-tv-with-multiple-voice-assistant-2025-model-/p/315384",
        sku: "315384",
      },
    ],
  },
  {
    item_code: "PROVOPLUS900",
    ourPrice: 22039,
    competitors: [
      {
        name: "Croma",
        price: 19990,
        was_price: null,
        url: "https://www.croma.com/prestige-provo-plus-90cm-1400m3-hr-ducted-auto-clean-wall-mounted-chimney-with-revolutionary-motion-sensor-black-/p/318579",
        sku: "318579",
      },
    ],
  },
  {
    item_code: "OSCARPLUS900",
    ourPrice: 18889,
    competitors: [
      {
        name: "Croma",
        price: 17490,
        was_price: null,
        url: "https://www.croma.com/prestige-oscar-plus-90cm-1200m3-hr-ducted-auto-clean-wall-mounted-chimney-with-safe-sense-technology-black-/p/318577",
        sku: "318577",
      },
    ],
  },
  {
    item_code: "HRB4952CKG",
    ourPrice: 67650,
    competitors: [
      {
        name: "Croma",
        price: 56990,
        was_price: null,
        url: "https://www.croma.com/haier-445-litres-2-star-frost-free-double-door-bottom-mount-convertible-refrigerator-with-triple-inverter-technology-hrb-4952ckg-p-black-glass-/p/268202",
        sku: "268202",
      },
    ],
  },
  {
    item_code: "NOISENBAIRWAVEPROANC",
    ourPrice: 1499,
    competitors: [
      {
        name: "Croma",
        price: 1299,
        was_price: null,
        url: "https://www.croma.com/noise-airwave-pro-neckband-with-active-noise-cancellation-ipx5-water-resistant-instacharge-matte-black-/p/315561",
        sku: "315561",
      },
    ],
  },
  {
    item_code: "JBLPBENCORE2",
    ourPrice: 26998,
    competitors: [
      {
        name: "Croma",
        price: 24999,
        was_price: null,
        url: "https://www.croma.com/jbl-partybox-encore-2-100w-bluetooth-party-speaker-with-mic-dynamic-lightshow-stereo-channel-black-/p/317986",
        sku: "317986",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    console.log(`📦 Tenant DB: ${TENANT_DB}`);

    const tenantDb = client.db(TENANT_DB);
    const competitorCol = tenantDb.collection("competitor_prices");
    const productsCol = tenantDb.collection("products");

    // Unique Index
    await competitorCol.createIndex(
      { item_code: 1, competitor_name: 1 },
      { unique: true }
    );

    // ─────────────────────────────────────────
    // Remove old Croma records for these item_codes
    // ─────────────────────────────────────────

    const itemCodes = seedData.map((p) => p.item_code);

    const deleteResult = await competitorCol.deleteMany({
      item_code: { $in: itemCodes },
      competitor_name: "Croma",
    });

    console.log(`\n🗑️  Removed ${deleteResult.deletedCount} old Croma record(s)`);

    let inserted = 0;
    let updated = 0;

    // ─────────────────────────────────────────
    // Insert / Update competitor prices
    // ─────────────────────────────────────────

    for (const product of seedData) {
      for (const comp of product.competitors) {
        const record = makeRecord(product.item_code, product.ourPrice, comp);

        const existing = await competitorCol.findOne({
          item_code: record.item_code,
          competitor_name: record.competitor_name,
        });

        await competitorCol.updateOne(
          {
            item_code: record.item_code,
            competitor_name: record.competitor_name,
          },
          {
            $set: { ...record, updatedAt: new Date() },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );

        if (existing) {
          updated++;
          console.log(`♻️ Updated : [${record.item_code}] ${record.competitor_name} → ₹${record.competitor_price} (${record.status})`);
        } else {
          inserted++;
          console.log(`➕ Inserted: [${record.item_code}] ${record.competitor_name} → ₹${record.competitor_price} (${record.status})`);
        }
      }
    }

    // ─────────────────────────────────────────
    // Update products scrape_status
    // ─────────────────────────────────────────

    const updateResult = await productsCol.updateMany(
      { item_code: { $in: itemCodes } },
      { $set: { scrape_status: "done", updatedAt: new Date() } }
    );

    console.log(`\n✅ scrape_status = "done" updated for ${updateResult.modifiedCount} product(s)`);

    // ─────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────

    console.log(`\n✅ Seed complete — ${inserted} inserted, ${updated} updated`);
    console.log("\n📊 Summary:");
    console.log("─".repeat(75));
    console.log(`${"Competitor".padEnd(20)} ${"Our Price".padEnd(12)} ${"Comp Price".padEnd(12)} ${"Diff".padEnd(12)} Status`);
    console.log("─".repeat(75));

    for (const product of seedData) {
      for (const comp of product.competitors) {
        const diff = comp.price - product.ourPrice;
        const status = computeStatus(product.ourPrice, comp.price);
        const diffStr = diff > 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`;
        console.log(
          `${comp.name.padEnd(20)} ₹${String(product.ourPrice).padEnd(10)} ₹${String(comp.price).padEnd(10)} ${diffStr.padEnd(12)} ${status}`
        );
      }
    }

    console.log("─".repeat(75));

    const totalDocs = await competitorCol.countDocuments();
    console.log(`\n🔍 competitor_prices collection total: ${totalDocs} docs`);
  } catch (err) {
    console.error("\n❌ Seed failed:");
    console.error(err);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

seed();
