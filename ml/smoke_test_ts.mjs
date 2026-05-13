// Mirror of classifierModel.ts in plain JS. Verifies the TS LR runtime
// produces the same tier/effort labels as the Python sklearn smoke test.
//
// Run from repo root: node ml/smoke_test_ts.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'app', 'src', 'lib', 'classifier-weights.json'),
    'utf8',
  ),
);

const TOKEN_RX = /\b\w\w+\b/g;

function tokenize(text) {
  const src = W.lowercase ? text.toLowerCase() : text;
  return src.match(TOKEN_RX) ?? [];
}

function ngrams(tokens, lo, hi) {
  const out = [];
  for (let n = lo; n <= hi; n++) {
    if (tokens.length < n) continue;
    for (let i = 0; i <= tokens.length - n; i++) {
      out.push(tokens.slice(i, i + n).join(' '));
    }
  }
  return out;
}

function buildSparseTfidf(text) {
  const tokens = tokenize(text);
  const grams = ngrams(tokens, W.ngram_range[0], W.ngram_range[1]);

  const counts = new Map();
  for (const g of grams) {
    const idx = W.vocab[g];
    if (idx === undefined) continue;
    counts.set(idx, (counts.get(idx) ?? 0) + 1);
  }
  const vec = new Map();
  for (const [idx, cnt] of counts) {
    const tf = W.sublinear_tf ? 1 + Math.log(cnt) : cnt;
    vec.set(idx, tf * W.idf[idx]);
  }
  let normSq = 0;
  for (const v of vec.values()) normSq += v * v;
  if (normSq > 0) {
    const inv = 1 / Math.sqrt(normSq);
    for (const [k, v] of vec) vec.set(k, v * inv);
  }
  return vec;
}

function dot(coefRow, vec) {
  let s = 0;
  for (const [idx, val] of vec) s += coefRow[idx] * val;
  return s;
}

function predictHead(head, vec) {
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < head.coef.length; i++) {
    const s = dot(head.coef[i], vec) + head.intercept[i];
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return head.classes[bestIdx];
}

const samples = [
  'What is the capital of France?',
  'Define osmosis.',
  'Refactor this Python function to use async/await and add proper error handling for the database connection.',
  'Write a binary search tree implementation in TypeScript with insert, delete, and traverse methods.',
  'Derive a closed-form expression for the Fibonacci sequence using the characteristic equation, then prove it by induction.',
  'translate hello to spanish',
  'Compose a thank-you note to my landlord for fixing the heater quickly.',
  '```python\ndef foo():\n    pass\n```\nAdd type hints and a docstring.',
  'Compare and contrast monolithic and microservice architectures in detail, including operational complexity, deployment, and team scaling tradeoffs.',
  'Who wrote Hamlet?',
  'Step by step, walk me through how to architect a production-ready event-sourced order pipeline with idempotency, retries, and exactly-once delivery guarantees.',
  'Summarize this paragraph: The quick brown fox jumps over the lazy dog.',
];

for (const s of samples) {
  const vec = buildSparseTfidf(s);
  const tier = predictHead(W.tier, vec);
  const effort = predictHead(W.effort, vec);
  const route = predictHead(W.route, vec);
  const short = s.length > 60 ? s.slice(0, 60) + '...' : s;
  console.log(
    `[${tier.padStart(8)}] [${effort.padStart(6)}] [${route.padStart(8)}]  ${short}`,
  );
}
