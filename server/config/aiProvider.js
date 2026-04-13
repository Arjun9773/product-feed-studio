
//if you want to change the AI provider, set the AI_PROVIDER environment variable to one of 'groq', 'anthropic', 'openai', or 'gemini' and provide the corresponding API key in the environment variables as well.

const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';

async function getCategoryFromAI(prompt) {
  console.log(`[AI Provider] Using: ${AI_PROVIDER}`);
  if (AI_PROVIDER === 'groq') {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    return result?.choices?.[0]?.message?.content?.trim() || '';
  }

  if (AI_PROVIDER === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const result = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    return result?.content?.[0]?.text?.trim() || '';
  }

  if (AI_PROVIDER === 'openai') {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      max_completion_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
       console.log('[OpenAI Full Result]:', JSON.stringify(result?.choices?.[0], null, 2));
    return result?.choices?.[0]?.message?.content?.trim() || '';
  }

  if (AI_PROVIDER === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
    const result = await model.generateContent(prompt);
    return result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
           result?.response?.text?.()?.trim() || '';
  }

  throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
}

module.exports = { getCategoryFromAI };