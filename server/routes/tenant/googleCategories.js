const express = require("express");
const auth = require("../../middleware/auth");
const tenantResolver = require("../../middleware/tenantResolver");
const Groq = require("groq-sdk");
const { getCategoryFromAI } = require("../../config/aiProvider");
const mongoose = require("mongoose");

const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// GET /api/google-categories — all categories
router.get("/", auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const categories = await db
      .collection("google_categories")
      .find({}, { projection: { _id: 0, google_taxonomy_id: 1, name: 1 } })
      .sort({ name: 1 })
      .toArray();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/google-categories/search?q=television
router.get("/search", auth, async (req, res) => {
  try {
    const q = req.query.q || "";
    const db = mongoose.connection.db;
    const categories = await db
      .collection("google_categories")
      .find(
        { name: { $regex: q, $options: "i" } },
        { projection: { _id: 0, google_taxonomy_id: 1, name: 1 } },
      )
      .limit(20)
      .toArray();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/google-categories/ai-fill

router.post("/ai-fill", auth, tenantResolver, async (req, res) => {
  const db = mongoose.connection.db;

  try {
    // 1. Unmapped products fetch
    const products = await req.tenantDb
      .collection("products")
      .find({
        $or: [
          { google_category: { $exists: false } },
          { google_category: "" },
          { google_category: null },
        ],
      })
      .toArray();

    if (products.length === 0) {
      return res.json({ message: "All products already mapped", updated: 0 });
    }

    // 2. Pending mark
    const ids = products.map((p) => p._id);
    await req.tenantDb
      .collection("products")
      .updateMany(
        { _id: { $in: ids } },
        { $set: { google_category_optimization_status: "pending" } },
      );

    // 3. Early response
    res.json({ message: "AI fill started", total: products.length });

    // 4. Batch processing — 10 products per batch
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      batches.push(products.slice(i, i + BATCH_SIZE));
    }

    const bulkOps = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      console.log(`Processing batch ${batchIdx + 1}/${batches.length}`);

      let success = false;
      let attempts = 0;

      while (!success && attempts < 3) {
        try {
          attempts++;

          // Step 1 — Batch prompt (no taxonomy list — AI)
          const productList = batch
            .map(
              (p, i) =>
                `${i + 1}. Product Name: ${p.product_name || ""} | Brand: ${p.brand || ""} | Category: ${p.category || ""}`,
            )
            .join("\n");

const TAXONOMY_HINTS = `
- Smartphone/Mobile Phone → Electronics > Communications > Telephony > Mobile Phones
- DSLR/Digital Camera → Cameras & Optics > Cameras > Digital Cameras
- Smart Watch/Smartwatch/Fitness Band/Wearable → Electronics > Electronics Accessories > Computer Accessories > Handheld Device Accessories
- Mixer Grinder/Blender/Wet Grinder → Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Mixers & Blenders
- Induction Cooktop/Electric Stove/Cooktop/Gas Stove/Burner Stove → Home & Garden > Kitchen & Dining > Kitchen Appliances > Cooktops
- Table Fan/Desk Fan/Stand Fan/Pedestal Fan → Home & Garden > Household Appliances > Climate Control Appliances > Fans > Desk & Pedestal Fans
- Beard Trimmer/Hair Trimmer/Shaver → Health & Beauty > Personal Care > Shaving & Grooming > Hair Clippers & Trimmers
- LED Bulb/Light Bulb → Home & Garden > Lighting > Light Bulbs > LED Light Bulbs
- Computer Mouse/Wired Mouse → Electronics > Electronics Accessories > Computer Components > Input Devices > Mice & Trackballs
- Television/Smart TV/LED TV/Google TV → Electronics > Video > Televisions
- Air Conditioner/AC/Split AC/Window AC → Home & Garden > Household Appliances > Climate Control Appliances > Air Conditioners
- Refrigerator/Fridge/Double Door/Single Door Fridge → Home & Garden > Kitchen & Dining > Kitchen Appliances > Refrigerators
- Microwave Oven/Solo Microwave/Convection Microwave → Home & Garden > Kitchen & Dining > Kitchen Appliances > Microwave Ovens
- Laptop → Electronics > Computers > Laptops
- Ceiling Fan → Home & Garden > Household Appliances > Climate Control Appliances > Fans > Ceiling Fans
- Water Heater/Geyser/Immersion Heater → Home & Garden > Household Appliances > Water Heaters
- Washing Machine/Top Load/Front Load → Home & Garden > Household Appliances > Laundry Appliances > Washing Machines
- Clothes Dryer/Dryer Machine → Home & Garden > Household Appliances > Laundry Appliances > Clothes Dryers
- Headphones/Earphones/Earbuds → Electronics > Audio > Audio Components > Headphones & Headsets > Headphones
- Flask/Bottle/Thermos → Home & Garden > Kitchen & Dining > Food & Beverage Carriers
- Pressure Cooker/Aluminium Cooker/Inner Lid Cooker/Outer Lid Cooker → Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Pressure Cookers & Canners
- Dry Iron/Steam Iron/Teflon Iron → Home & Garden > Household Appliances > Laundry Appliances > Irons & Steamers
- Vacuum Cleaner/Handheld Vacuum → Home & Garden > Household Appliances > Floor Care > Vacuum Cleaners
- Voltage Stabilizer/AC Stabilizer/Booster Stabilizer → Home & Garden > Household Appliances > Power Supplies > Voltage Stabilizers
- Air Cooler/Room Cooler/Personal Cooler → Home & Garden > Household Appliances > Climate Control Appliances > Air Coolers
- Water Dispenser/Bottled Water Dispenser → Home & Garden > Household Appliances > Water Dispensers
- Electric Kettle/Water Kettle → Home & Garden > Kitchen & Dining > Kitchen Appliances > Electric Kettles
- Rice Cooker/Electric Rice Cooker → Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Cookers & Steamers > Rice Cookers
- Coffee Maker/Drip Coffee → Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Drip Coffee Makers
- Toaster/Pop Up Toaster → Home & Garden > Kitchen & Dining > Kitchen Appliances > Toasters & Grills > Toasters
- Hand Mixer/Electric Mixer → Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Mixers & Blenders
- Non Stick Tawa/Kadai/Frying Pan/Skillet → Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Skillets & Frying Pans
- Cookware Set/Kitchen Set → Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Cookware Sets
- Sound Bar/Home Theatre/Speaker System → Electronics > Audio > Audio Players & Recorders > Home Theater Systems
- Hair Dryer → Health & Beauty > Personal Care > Hair Care > Hair Styling Tools > Hair Dryers
`;

          //           const prompt = `You are a Google Product Taxonomy expert.
          // For each product below, return the EXACT Google Product Taxonomy category path.

          // Reference mappings (use these exact paths when applicable):
          // ${TAXONOMY_HINTS}

          // Products:
          // ${productList}

          // Rules:
          // - Use ONLY paths from official Google Product Taxonomy
          // - If product matches a reference mapping above, use that EXACT path
          // - For unknown products, use your knowledge of Google taxonomy
          // - Reply with ONLY a JSON array of strings, one per product in same order
          // - No explanation. Just the JSON array.
          // - CRITICAL: Return EXACTLY ${batch.length} items in the JSON array
          // - Items must be in the EXACT SAME ORDER as the products listed (product 1 → array[0], product 2 → array[1])
          // - Count your items before responding`;

          const prompt = `You are a Google Product Taxonomy expert.
                     For each product below, return the EXACT Google Product Taxonomy category path.

                  Reference mappings (use these exact paths when applicable):
                           ${TAXONOMY_HINTS}

                       Products:
${productList}

Rules:
- Use ONLY paths from official Google Product Taxonomy (https://www.google.com/basepages/producttype/taxonomy.en-US.txt)
- If product matches a reference mapping above, use that EXACT path
- For unknown products, use your knowledge of Google taxonomy
- Reply with ONLY a JSON array of strings, one per product in same order
- No explanation. Just the JSON array.
- CRITICAL: Return EXACTLY ${batch.length} items in the JSON array
- Items must be in the EXACT SAME ORDER as products listed (product 1 → array[0])
- Count your items before responding`;

          const raw = await getCategoryFromAI(prompt);
          // console.log(`[Raw Response] Batch ${batchIdx + 1}:`, raw);
          // Step 2 — JSON parse
          let suggestions = [];
          try {
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("No JSON array found");
            suggestions = JSON.parse(jsonMatch[0]);
          } catch {
            // JSON parse fail aana — line by line parse try pannuvom
            suggestions = raw
              .split("\n")
              .map((line) => line.replace(/^[\d\.\-\*\s"]+|["]+$/g, "").trim())
              .filter(Boolean)
              .slice(0, batch.length);

            if (suggestions.length === 0)
              throw new Error("Invalid JSON response");
          }
         // error handling — if suggestions count mismatch, skip batch to avoid misalignment  
//          for (let i = 0; i < batch.length; i++) {
//   const product = batch[i];
//   const aiSuggested = suggestions[i]?.trim() || "";

//   if (!aiSuggested) continue;

//   // Exact match check only
//   const exactMatch = await db
//     .collection("google_categories")
//     .findOne({ name: aiSuggested });

//   if (exactMatch) {
//     console.log(`Product ${product._id} (${product.product_name}) → EXACT: "${exactMatch.name}"`);
//     bulkOps.push({
//       updateOne: {
//         filter: { _id: product._id },
//         update: {
//           $set: {
//             google_category: exactMatch.name,
//             google_category_optimization_status: "done",
//           },
//         },
//       },
//     });
//   } else {
//     // Skip — console
//     console.log(`Product ${product._id} (${product.product_name}) → NO MATCH: "${aiSuggested}" — skipped`);
//   }
// }
// 1. Exact match only — no close match, no fallback
//           for (let i = 0; i < batch.length; i++) {
//   const product = batch[i];
//   const aiSuggested = suggestions[i]?.trim() || "";

//   if (!aiSuggested) continue;
  
//   // Exact match only — no close match, no fallback
//   const exactMatch = await db.collection("google_categories").findOne({
//     name: aiSuggested,
//   });

//   if (exactMatch) {
//     console.log(`Product ${product._id} (${product.product_name}) → EXACT: "${exactMatch.name}"`);
//     bulkOps.push({
//       updateOne: {
//         filter: { _id: product._id },
//         update: {
//           $set: {
//             google_category:exactMatch.name,
//             google_category_optimization_status: "done",
//           },
//         },
//       },
//     });
//   } else {
//     // No exact match — skip, leave google_category empty
//     console.log(`Product ${product._id} (${product.product_name}) → NO EXACT MATCH — skipping`);
//   }
// }          

      for (let i = 0; i < batch.length; i++) {
  const product = batch[i];
const aiSuggested = suggestions[i]?.trim() || "";

  if (!aiSuggested) {
    console.log(`Product ${product._id} (${product.product_name}) → SKIPPED: empty response`);
    continue;
  }

  console.log(`Product ${product._id} (${product.product_name}) → SAVED: "${aiSuggested}"`);

  bulkOps.push({
    updateOne: {
      filter: { _id: product._id },
      update: {
        $set: {
          google_category: aiSuggested,
          google_category_optimization_status: "done",
        },
      },
    },
  });
}
          success = true;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(
            `Batch ${batchIdx + 1} attempt ${attempts} failed:`,
            err.message,
          );

          if (err.message.includes("429") || err.message.includes("rate")) {
            console.log("Rate limit — waiting 10s...");
            await new Promise((resolve) => setTimeout(resolve, 10000));
          } else {
            break;
          }
        }
      }

      // Batch fail → failed mark
      if (!success) {
        const failIds = batch.map((p) => p._id);
        await req.tenantDb
          .collection("products")
          .updateMany(
            { _id: { $in: failIds } },
            { $set: { google_category_optimization_status: "failed" } },
          );
        console.log(`Batch ${batchIdx + 1} → failed`);
      }
    }

    if (bulkOps.length > 0) {
      await req.tenantDb.collection("products").bulkWrite(bulkOps);
    }

    console.log(
      `AI fill complete — ${bulkOps.length}/${products.length} updated`,
    );
  } catch (error) {
    console.error("AI fill error:", error.message);
  }
});
module.exports = router;
