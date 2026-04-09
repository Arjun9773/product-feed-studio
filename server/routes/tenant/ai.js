const express = require('express');
const axios   = require('axios');
const auth    = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');

const router = express.Router();

router.post('/fill-field', auth, tenantResolver, async (req, res) => {
  try {
    const { products, fieldLabel } = req.body;

    if (!products?.length) {
      return res.status(400).json({ success: false, message: 'No products provided' });
    }

    const results = await Promise.all(
      products.map(async (product) => {
        try {
          const prompt = `You are a product data specialist. Extract product attributes from the given details.

Product Name: "${product.product_name || product.title || ''}"
Brand: "${product.brand || ''}"
Category: "${product.category || ''}"
Price: "${product.price || ''}"
Product URL: "${product.product_url || ''}"

Task: What is the "${fieldLabel}" for this product?

Examples of good responses:
- Colour → "Black" or "Silver" or "White"
- Size → "43 inches" or "XL" or "250ml"
- Material → "Plastic" or "Cotton" or "Metal"
- Gender → "Male" or "Female" or "Unisex"
- Age Group → "Adults" or "Kids" or "All Ages"

Rules:
- Return ONLY the value, nothing else
- Extract from product name if possible
- Maximum 3 words
- If genuinely cannot determine, return: null
- NEVER return "N/A", "Not available", "No ${fieldLabel}", "Unknown", "Not specified"`;

          const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: 'openai/gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }]
            },
            {
              headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              }
            }
          );

          const raw = response.data?.choices?.[0]?.message?.content?.trim() || '';

          const isSentence    = raw.split(' ').length > 4;
          const isPlaceholder = /^(null|n\/a|na|no\b|not\b|none|unknown|unspecified|undefined)/i.test(raw);
          const value         = (isSentence || isPlaceholder) ? '' : raw;

          console.log(`[AI] ${product.product_name} → raw: "${raw}" → final: "${value}"`);

          return {
            id:     product.sourceId,
            value,
            status: value ? 'filled' : 'unverified'
          };

        } catch {
          return { id: product.sourceId, value: '', status: 'unverified' };
        }
      })
    );

    res.json({ success: true, data: results });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
