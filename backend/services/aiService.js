/**
 * AI Summarization Service — Hugging Face Inference API (free tier)
 *
 * Models used:
 *   Summary   : facebook/bart-large-cnn  (abstractive summarization)
 *   Key points: Extracted from original text (sentence sampling)
 *
 * Setup:
 *   1. Create a free account at https://huggingface.co
 *   2. Go to Settings → Access Tokens → New token (role: "read" is enough)
 *   3. Add to backend/.env:
 *        HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxx
 *
 * Free-tier notes:
 *   - No hard monthly cap for hosted model inference
 *   - Input is capped at ~1 024 tokens by the model (we pre-trim to 3 000 chars)
 *   - First request may take ~20 s while the model cold-starts (wait_for_model handles this)
 */

require('dotenv').config();

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const SUMMARY_MODEL = 'facebook/bart-large-cnn';
const HF_BASE = 'https://router.huggingface.co/hf-inference/models';

/**
 * Calls the HF Inference API for abstractive summarization.
 * @param {string} text
 * @returns {Promise<string>}
 */
async function callHuggingFace(text) {
  if (!HF_API_TOKEN) {
    throw new Error(
      'HF_API_TOKEN is not set. Add it to backend/.env — see aiService.js for instructions.'
    );
  }

  // BART handles ~1 024 tokens; trim input to ~3 000 chars to stay safe
  const input = text.slice(0, 3000).trim();

  const response = await fetch(`${HF_BASE}/${SUMMARY_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: input,
      parameters: {
        max_length: 200,
        min_length: 40,
        do_sample: false,
      },
      options: {
        wait_for_model: true, // wait out cold-start instead of returning 503
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HuggingFace API error ${response.status}: ${body}`);
  }

  const data = await response.json();

  // HF returns [{ summary_text: "..." }]
  if (Array.isArray(data) && data[0]?.summary_text) {
    return data[0].summary_text;
  }

  // Occasionally returns { error: "..." } even with 200
  if (data?.error) throw new Error(`HuggingFace model error: ${data.error}`);

  throw new Error('Unexpected response shape from HuggingFace API.');
}

/**
 * Extracts up to `count` representative sentences from the original text.
 * @param {string} text
 * @param {number} count
 * @returns {string[]}
 */
function extractKeyPoints(text, count = 5) {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);

  if (sentences.length === 0) return ['No key points could be extracted.'];

  const step = Math.max(1, Math.floor(sentences.length / count));
  const points = [];
  for (let i = 0; i < sentences.length && points.length < count; i += step) {
    points.push(sentences[i]);
  }
  return points;
}

/**
 * Main entry point called by Express routes.
 * @param {string} text  Full document text
 * @returns {Promise<{ summary: string, keyPoints: string[] }>}
 */
async function summarize(text) {
  const summary = await callHuggingFace(text);
  const keyPoints = extractKeyPoints(text, 5);
  return { summary, keyPoints };
}

module.exports = { summarize };
