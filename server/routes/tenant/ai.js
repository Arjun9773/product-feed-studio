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
          const prompt = `Product: "${product.product_name || product.title || ''}"
            Brand: "${product.brand || ''}"
            Category: "${product.category || ''}"
            What is the "${fieldLabel}" for this product?
            Reply with ONLY the value, nothing else. Keep it short (1-3 words max).`;

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

          const value = response.data?.choices?.[0]?.message?.content?.trim() || '';
          return { id: product.sourceId, value };

        } catch {
          return { id: product.sourceId, value: '' };
        }
      })
    );

    res.json({ success: true, data: results });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
