const express = require('express');
const axios   = require('axios');
const auth    = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');
const { getCategoryFromAI } = require('../../config/aiProvider');

const router = express.Router();

function getFieldExamples(fieldLabel) {
  const examples = {
    'Color':     '→ Black\n→ Silver\n→ White',
    'Material':  '→ Plastic\n→ Metal\n→ Glass',
    'Gender':    '→ Male\n→ Female\n→ Unisex',
    'Age Group': '→ Adults\n→ Kids\n→ All Ages',
    'Pattern':   '→ Solid\n→ Striped\n→ Printed',
  };
  return examples[fieldLabel] || '→ Extract directly from product name or category';
}

router.post('/fill-field', auth, tenantResolver, async (req, res) => {
  try {
    const { products, fieldLabel } = req.body;
     console.log(`[AI] fieldLabel: "${fieldLabel}"`);

    if (!products?.length) {
      return res.status(400).json({ success: false, message: 'No products provided' });
    }

    const results = await Promise.all(
      products.map(async (product) => {
        try {
         const prompt = `You are a product attribute extractor.

PRODUCT:
- Name: "${product.product_name || ''}"
- Brand: "${product.brand || ''}"
- Category: "${product.category || ''}"
- Price: "${product.price || ''}"

TASK: Extract "${fieldLabel}" from the product details above.

OUTPUT FORMAT:
- Single value only (max 3 words)
- No explanation, no punctuation, no extra text
- If unknown, output: null

EXAMPLES FOR "${fieldLabel}":
${getFieldExamples(fieldLabel)}

YOUR ANSWER:`;

       
          const raw = await getCategoryFromAI(prompt);

          console.log(`[AI] ${product.product_name} → raw: "${raw}"`);

         const cleaned       = raw.replace(/^["']|["']$/g, '').trim();
         const isSentence    = fieldLabel === 'description' ? false : cleaned.split(' ').length > 5;
        const isPlaceholder = /^(null|n\/a|na|none|unknown|unspecified|undefined|no\s+description|no\s+info)/i.test(cleaned);
         const value         = (isSentence || isPlaceholder) ? '' : cleaned;

    

          return {
            id:     product.sourceId,
            value,
            status: value ? 'filled' : 'unverified'
          };

        } catch (err) {
          console.log('[AI] ERROR:', err.message);
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
