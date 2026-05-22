// ============================================================
// AI Image Generation Route
// POST /ai/generate-all-additional-images
//
// Body: { productId, mainImageUrl, productName }
//
// - Uses GPT-4o Vision to describe the main product image
// - Generates 8 additional images (different angles) in PARALLEL
//   using Pollinations.AI (completely FREE, no API key needed)
// - Saves all 8 image URLs to the product in DB
// ============================================================

const express = require('express');
const router  = express.Router();
const fetch   = (...args) => import('node-fetch').then(({default: f}) => f(...args));

// ── 8 angle prompts for additional images ────────────────────
const ANGLE_CONFIGS = [
  { field: 'additional_image_1', angle: 'front view, straight on'         },
  { field: 'additional_image_2', angle: 'left side profile view'           },
  { field: 'additional_image_3', angle: 'right side profile view'          },
  { field: 'additional_image_4', angle: 'back view, rear angle'            },
  { field: 'additional_image_5', angle: 'top down overhead view'           },
  { field: 'additional_image_6', angle: '45 degree front-left angle view'  },
  { field: 'additional_image_7', angle: '45 degree front-right angle view' },
  { field: 'additional_image_8', angle: 'close-up detail macro shot'       },
];

// ── Step 1: Describe main product image using GPT-4o Vision ──
async function describeProductImage(mainImageUrl, productName) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: mainImageUrl, detail: 'low' },
          },
          {
            type: 'text',
            text: `Describe this product in 50 words max for an image generation prompt.
Include: product type, color, material, shape, design features.
No brand names, no people, no text, no logos.
Product hint: "${productName || ''}"`,
          },
        ],
      }],
    });

    return res?.choices?.[0]?.message?.content?.trim() || productName || 'a product';
  } catch (err) {
    console.warn('[AI Image] Vision failed, using product name only:', err.message);
    return productName || 'a product';
  }
}

// ── Step 2: Generate one image via Pollinations (FREE) ───────
async function generateOneImage(productDesc, angleText, seed) {
  const prompt = `Professional product photography: ${productDesc}. ${angleText}. Pure white background, studio lighting, sharp focus, high resolution commercial product photo. No text, no watermarks, no people, no logos.`;

  const encoded = encodeURIComponent(prompt);
  // Pollinations URL — just calling this URL returns the image
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true&model=flux`;

  // Ping the URL so Pollinations pre-generates it (optional but warms cache)
  try {
    await fetch(url, { method: 'HEAD', timeout: 5000 });
  } catch (_) { /* ignore, URL still works */ }

  return url; // Pollinations serves image directly from URL
}

// ── POST /ai/generate-all-additional-images ──────────────────
router.post('/generate-all-additional-images', async (req, res) => {
  const { productId, mainImageUrl, productName } = req.body;

  if (!productId)    return res.status(400).json({ message: 'productId is required' });
  if (!mainImageUrl) return res.status(400).json({ message: 'mainImageUrl is required' });

  try {
    console.log(`[AI Image] Generating 8 images for product: ${productId}`);

    // Step 1: Describe the product
    const productDesc = await describeProductImage(mainImageUrl, productName);
    console.log('[AI Image] Description:', productDesc);

    // Step 2: Generate all 8 in PARALLEL
    const baseSeed = Date.now();
    const results = await Promise.allSettled(
      ANGLE_CONFIGS.map(({ field, angle }, idx) =>
        generateOneImage(productDesc, angle, baseSeed + idx)
          .then(url => ({ field, url, status: 'success' }))
          .catch(err => ({ field, url: null, status: 'failed', error: err.message }))
      )
    );

    // Build updates object
    const updates = {};
    const generated = [];
    const failed    = [];

    results.forEach(result => {
      const { field, url, status } = result.value || {};
      if (status === 'success' && url) {
        updates[field] = url;
        generated.push(field);
      } else {
        failed.push(field);
      }
    });

    console.log(`[AI Image] Generated: ${generated.length}, Failed: ${failed.length}`);

    // Step 3: Save all to DB in one bulk update
    if (Object.keys(updates).length > 0) {
      // Build bulk-update payload matching your existing /products/bulk-update format
      // Each field saved separately since they are different field names
      const Product = require('../models/Product'); // adjust path as needed

      await Product.findOneAndUpdate(
        { sourceId: productId },
        { $set: updates },
        { new: true }
      );

      console.log(`[AI Image] ✅ Saved ${generated.length} images to DB for product: ${productId}`);
    }

    return res.status(200).json({
      success:   true,
      productId,
      generated: generated.length,
      failed:    failed.length,
      images:    updates, // { additional_image_1: url, additional_image_2: url, ... }
    });

  } catch (err) {
    console.error('[AI Image] Error:', err?.message || err);
    return res.status(500).json({ message: err?.message || 'Image generation failed' });
  }
});

// ── POST /ai/generate-single-additional-image ────────────────
// For regenerating one specific field
router.post('/generate-single-additional-image', async (req, res) => {
  const { productId, mainImageUrl, productName, field } = req.body;

  if (!productId || !mainImageUrl || !field) {
    return res.status(400).json({ message: 'productId, mainImageUrl, field are required' });
  }

  const config = ANGLE_CONFIGS.find(c => c.field === field);
  if (!config) return res.status(400).json({ message: `Unknown field: ${field}` });

  try {
    const productDesc = await describeProductImage(mainImageUrl, productName);
    const url         = await generateOneImage(productDesc, config.angle, Date.now());

    // Save to DB
    const Product = require('../models/Product'); // adjust path as needed
    await Product.findOneAndUpdate(
      { sourceId: productId },
      { $set: { [field]: url } },
      { new: true }
    );

    return res.status(200).json({ success: true, field, url });
  } catch (err) {
    console.error('[AI Image] Single generate error:', err?.message);
    return res.status(500).json({ message: err?.message || 'Failed' });
  }
});

module.exports = router;

// ============================================================
// SETUP
// ============================================================
// app.js:
//   const aiImageRoutes = require('./routes/aiImageGeneration');
//   app.use('/ai', aiImageRoutes);
//
// .env:
//   OPENAI_API_KEY=sk-...   ← only for vision description step
//                              (if no key, falls back to product name)
//
// Pollinations = completely FREE, no key needed
// ============================================================
