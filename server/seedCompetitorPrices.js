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

  const diffPct = parseFloat(
    ((diff / ourPrice) * 100).toFixed(2)
  );

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
    item_code: "43P7GT",
    ourPrice: 33990,

    competitors: [
      {
        name: "Flipkart",
        price: 31990,
        was_price: 52490,
        url: "https://www.flipkart.com/haier-108-cm-43-inch-full-hd-smart-google-tv/p/itm43p7gt",
        sku: "TVSG4BQNHKKGPHHZ",
      },

      {
        name: "Amazon",
        price: 33990,
        was_price: 52490,
        url: "https://www.amazon.in/dp/B0CXHAIER43",
        sku: "B0CXHAIER43",
      },

      {
        name: "Croma",
        price: 34490,
        was_price: 54990,
        url: "https://www.croma.com/haier-43-inch-google-tv-43p7gt/p/264891",
        sku: "CRTV026489",
      },

      {
        name: "Reliance Digital",
        price: 35990,
        was_price: 52490,
        url: "https://www.reliancedigital.in/haier-43p7gt-43-inch-smart-google-tv/p/492847",
        sku: "RD-HAI-43P7GT",
      },

      {
        name: "Vijay Sales",
        price: 33490,
        was_price: 50990,
        url: "https://www.vijaysales.com/haier-43-smart-google-tv-43p7gt/55293",
        sku: "VS-HAI-43P7GT",
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
    // Connect
    await client.connect();

    console.log("✅ Connected to MongoDB");
    console.log(`📦 Tenant DB: ${TENANT_DB}`);

    // Tenant DB
    const tenantDb = client.db(TENANT_DB);

    // Collections
    const competitorCol = tenantDb.collection("competitor_prices");
    const productsCol = tenantDb.collection("products");

    // Unique Index
    await competitorCol.createIndex(
      {
        item_code: 1,
        competitor_name: 1,
      },
      {
        unique: true,
      }
    );

    let inserted = 0;
    let updated = 0;

    // ─────────────────────────────────────────
    // Insert / Update competitor prices
    // ─────────────────────────────────────────

    for (const product of seedData) {
      for (const comp of product.competitors) {
        const record = makeRecord(
          product.item_code,
          product.ourPrice,
          comp
        );

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
            $set: {
              ...record,
              updatedAt: new Date(),
            },

            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          {
            upsert: true,
          }
        );

        if (existing) {
          updated++;

          console.log(
            `♻️ Updated : [${record.item_code}] ${record.competitor_name} → ₹${record.competitor_price} (${record.status})`
          );
        } else {
          inserted++;

          console.log(
            `➕ Inserted: [${record.item_code}] ${record.competitor_name} → ₹${record.competitor_price} (${record.status})`
          );
        }
      }
    }

    // ─────────────────────────────────────────
    // Update products scrape_status
    // ─────────────────────────────────────────

    const itemCodes = seedData.map((p) => p.item_code);

    const updateResult = await productsCol.updateMany(
      {
        item_code: {
          $in: itemCodes,
        },
      },
      {
        $set: {
          scrape_status: "done",
          updatedAt: new Date(),
        },
      }
    );

    console.log(
      `\n✅ scrape_status = "done" updated for ${updateResult.modifiedCount} product(s)`
    );

    // ─────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────

    console.log(
      `\n✅ Seed complete — ${inserted} inserted, ${updated} updated`
    );

    console.log("\n📊 Summary:");
    console.log("─".repeat(75));

    console.log(
      `${"Competitor".padEnd(20)} ${"Our Price".padEnd(
        12
      )} ${"Comp Price".padEnd(12)} ${"Diff".padEnd(
        12
      )} Status`
    );

    console.log("─".repeat(75));

    for (const product of seedData) {
      for (const comp of product.competitors) {
        const diff = comp.price - product.ourPrice;

        const status = computeStatus(
          product.ourPrice,
          comp.price
        );

        const diffStr =
          diff > 0
            ? `+₹${diff}`
            : `-₹${Math.abs(diff)}`;

        console.log(
          `${comp.name.padEnd(20)} ₹${String(
            product.ourPrice
          ).padEnd(10)} ₹${String(comp.price).padEnd(
            10
          )} ${diffStr.padEnd(12)} ${status}`
        );
      }
    }

    console.log("─".repeat(75));

    // Total count
    const totalDocs =
      await competitorCol.countDocuments();

    console.log(
      `\n🔍 competitor_prices collection total: ${totalDocs} docs`
    );
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
