/**
 * AI Job Description Analysis Service — Hugging Face Inference API (free tier)
 *
 * Extracts structured fields from a job description:
 *   - summary        : short overview of the role
 *   - technicalSkills: programming languages, frameworks, tools
 *   - softSkills     : communication, teamwork, etc.
 *   - languageSkills : spoken/written language requirements
 *   - experience     : years of experience, seniority level
 *   - education      : degree requirements
 *   - keyPoints      : other notable requirements or benefits
 */

require('dotenv').config();

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const SUMMARY_MODEL = 'facebook/bart-large-cnn';
const HF_BASE = 'https://router.huggingface.co/hf-inference/models';

async function callHuggingFace(text) {
  if (!HF_API_TOKEN) {
    throw new Error('HF_API_TOKEN is not set. Add it to backend/.env');
  }

  const input = text.slice(0, 3000).trim();

  const response = await fetch(`${HF_BASE}/${SUMMARY_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: input,
      parameters: { max_length: 200, min_length: 40, do_sample: false },
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HuggingFace API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  if (Array.isArray(data) && data[0]?.summary_text) return data[0].summary_text;
  if (data?.error) throw new Error(`HuggingFace model error: ${data.error}`);
  throw new Error('Unexpected response shape from HuggingFace API.');
}

// ── Regex-based extractors ────────────────────────────────────────────────────

const TECH_SKILLS_KEYWORDS = [
  'javascript','typescript','python','java','c#','c\\+\\+','go','rust','ruby','php','swift','kotlin',
  'react','vue','angular','node','express','django','flask','spring','laravel',
  'sql','mysql','postgresql','mongodb','redis','elasticsearch',
  'aws','azure','gcp','docker','kubernetes','terraform','git','linux',
  'html','css','rest','graphql','kafka','spark','hadoop',
];

const SOFT_SKILLS_KEYWORDS = [
  'communication','teamwork','collaboration','leadership','problem.solving',
  'critical thinking','time management','adaptability','creativity','attention to detail',
  'interpersonal','self.motivated','proactive','analytical','organised','organized',
  'multitask','fast.paced','initiative','ownership','mentoring',
];

const LANGUAGE_KEYWORDS = [
  'english','mandarin','chinese','malay','bahasa','tamil','japanese','korean',
  'french','german','spanish','arabic','hindi','cantonese',
];

const EXPERIENCE_PATTERNS = [
  /(\d+\+?\s*(?:to|-)\s*\d*\s*years?(?:\s+of)?\s+(?:relevant\s+)?experience)/gi,
  /(\d+\+?\s*years?(?:\s+of)?\s+(?:relevant\s+|working\s+)?experience)/gi,
  /(senior|junior|mid.level|entry.level|lead|principal|staff)\s+(?:level\s+)?(?:engineer|developer|analyst|designer|manager)/gi,
  /minimum\s+(?:of\s+)?\d+\s+years?/gi,
];

const EDUCATION_PATTERNS = [
  /(bachelor'?s?|master'?s?|phd|doctorate|degree)\s+in\s+[\w\s,]+/gi,
  /(?:computer science|information technology|software engineering|related field)/gi,
  /(?:diploma|certificate)\s+in\s+[\w\s]+/gi,
];

function extractByKeywords(text, keywords) {
  const found = new Set();
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(lower)) {
      found.add(kw.replace(/\\\+/g, '+').replace(/\\/g, ''));
    }
  }
  return [...found];
}

function extractByPatterns(text, patterns) {
  const found = new Set();
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const val = m[0].trim();
      if (val.length < 120) found.add(val);
    }
  }
  return [...found];
}

function extractLanguageSkills(text) {
  const found = [];
  const lower = text.toLowerCase();
  for (const lang of LANGUAGE_KEYWORDS) {
    const re = new RegExp(`\\b${lang}\\b`, 'i');
    if (!re.test(lower)) continue;
    // Try to capture proficiency level nearby
    const profRe = new RegExp(
      `(fluent|proficient|native|basic|working|conversational|written|spoken|business)?\\s*(?:in\\s+)?\\b${lang}\\b[^.\\n]{0,60}`,
      'gi'
    );
    const matches = [...text.matchAll(profRe)];
    if (matches.length) {
      matches.forEach(m => {
        const val = m[0].trim().replace(/\s+/g, ' ');
        if (val.length < 80) found.push(val);
      });
    } else {
      found.push(lang.charAt(0).toUpperCase() + lang.slice(1));
    }
  }
  return [...new Set(found)];
}

// ─────────────────────────────────────────────────────────────────────────────

async function summarize(text) {
  const summary = await callHuggingFace(text);

  const technicalSkills = extractByKeywords(text, TECH_SKILLS_KEYWORDS)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  const softSkills = extractByKeywords(text, SOFT_SKILLS_KEYWORDS)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  const languageSkills = extractLanguageSkills(text);

  const experience = extractByPatterns(text, EXPERIENCE_PATTERNS);

  const education = extractByPatterns(text, EDUCATION_PATTERNS)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  // keyPoints = anything not captured above (fallback sentence sampling)
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 200);
  const step = Math.max(1, Math.floor(sentences.length / 4));
  const keyPoints = sentences.filter((_, i) => i % step === 0).slice(0, 4);

  return {
    summary,
    technicalSkills,
    softSkills,
    languageSkills,
    experience,
    education,
    keyPoints,
  };
}

module.exports = { summarize };

