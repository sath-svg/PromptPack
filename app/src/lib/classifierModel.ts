/**
 * Logistic-regression inference for prompt routing.
 *
 * Mirrors sklearn's TfidfVectorizer (sublinear_tf, l2 norm, lowercase, word
 * tokens of 2+ chars, 1–2 grams) followed by LogisticRegression. Trained
 * weights live in `classifier-weights.json` (built by `ml/train_classifier.py`).
 *
 * Two heads:
 *   - tier:   fast | balanced | powerful
 *   - effort: low  | medium   | high      (universal reasoning-budget knob)
 */

import weightsRaw from './classifier-weights.json';
import type { ModelTier } from './classifier';

export type EffortLevel = 'low' | 'medium' | 'high';

/**
 * Routing class emitted by the third LR head. Determines which dispatch
 * path `chatStore.sendMessage` takes:
 *   - `chat`     → single-shot (managed proxy, no tools, no decomposition)
 *   - `agent`    → tool loop (gated by workspace presence)
 *   - `workflow` → SkillFlow (planner + subtasks + merge)
 */
export type RouteClass = 'chat' | 'agent' | 'workflow';

interface ClassifierHead {
  classes: string[];
  coef: number[][];
  intercept: number[];
}

interface Weights {
  vocab: Record<string, number>;
  idf: number[];
  ngram_range: [number, number];
  sublinear_tf: boolean;
  lowercase: boolean;
  tier: ClassifierHead;
  effort: ClassifierHead;
  route: ClassifierHead;
}

const W = weightsRaw as unknown as Weights;

const TOKEN_RX = /\b\w\w+\b/g;

function tokenize(text: string): string[] {
  const src = W.lowercase ? text.toLowerCase() : text;
  return src.match(TOKEN_RX) ?? [];
}

function ngrams(tokens: string[], lo: number, hi: number): string[] {
  const out: string[] = [];
  for (let n = lo; n <= hi; n++) {
    if (tokens.length < n) continue;
    for (let i = 0; i <= tokens.length - n; i++) {
      out.push(tokens.slice(i, i + n).join(' '));
    }
  }
  return out;
}

function buildSparseTfidf(text: string): Map<number, number> {
  const tokens = tokenize(text);
  const grams = ngrams(tokens, W.ngram_range[0], W.ngram_range[1]);

  const counts = new Map<number, number>();
  for (const g of grams) {
    const idx = W.vocab[g];
    if (idx === undefined) continue;
    counts.set(idx, (counts.get(idx) ?? 0) + 1);
  }

  const vec = new Map<number, number>();
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

function dot(coefRow: number[], vec: Map<number, number>): number {
  let s = 0;
  for (const [idx, val] of vec) s += coefRow[idx] * val;
  return s;
}

function predictHead<T extends string>(head: ClassifierHead, vec: Map<number, number>): T {
  if (head.coef.length === 1) {
    const score = dot(head.coef[0], vec) + head.intercept[0];
    return (score > 0 ? head.classes[1] : head.classes[0]) as T;
  }
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < head.coef.length; i++) {
    const s = dot(head.coef[i], vec) + head.intercept[i];
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return head.classes[bestIdx] as T;
}

/**
 * Multinomial-LR softmax probabilities. Used for confidence-gated LLM
 * fallback (Phase 3) — when the top class's probability is below a
 * threshold, the dispatch layer routes through a cheap LLM tiebreaker.
 */
function predictHeadWithProbs<T extends string>(
  head: ClassifierHead,
  vec: Map<number, number>,
): { label: T; probs: Record<string, number>; topProb: number } {
  const scores: number[] = [];
  for (let i = 0; i < head.coef.length; i++) {
    scores.push(dot(head.coef[i], vec) + head.intercept[i]);
  }
  // Numerically stable softmax
  const maxS = Math.max(...scores);
  let sum = 0;
  const exps = scores.map((s) => {
    const e = Math.exp(s - maxS);
    sum += e;
    return e;
  });
  const probs: Record<string, number> = {};
  let bestIdx = 0;
  let bestProb = -Infinity;
  for (let i = 0; i < exps.length; i++) {
    const p = exps[i] / sum;
    probs[head.classes[i]] = p;
    if (p > bestProb) {
      bestProb = p;
      bestIdx = i;
    }
  }
  return {
    label: head.classes[bestIdx] as T,
    probs,
    topProb: bestProb,
  };
}

export function predictTier(prompt: string): ModelTier {
  const vec = buildSparseTfidf(prompt);
  return predictHead<ModelTier>(W.tier, vec);
}

export function predictEffort(prompt: string): EffortLevel {
  const vec = buildSparseTfidf(prompt);
  return predictHead<EffortLevel>(W.effort, vec);
}

export function predictRoute(prompt: string): RouteClass {
  const vec = buildSparseTfidf(prompt);
  return predictHead<RouteClass>(W.route, vec);
}

export interface RoutePrediction {
  route: RouteClass;
  /** Probability of the chosen class (0..1). Used by Phase 3 fallback gate. */
  confidence: number;
  /** Full distribution across all classes. */
  probs: Record<string, number>;
}

export function predictRouteWithConfidence(prompt: string): RoutePrediction {
  const vec = buildSparseTfidf(prompt);
  const { label, probs, topProb } = predictHeadWithProbs<RouteClass>(W.route, vec);
  return { route: label, confidence: topProb, probs };
}

export function classifyPrompt(prompt: string): {
  tier: ModelTier;
  effort: EffortLevel | null;
  route: RouteClass;
} {
  const vec = buildSparseTfidf(prompt);
  const tier = predictHead<ModelTier>(W.tier, vec);
  const route = predictHead<RouteClass>(W.route, vec);
  // effort is only meaningful for mid (balanced) or powerful tiers; fast tier
  // never gets a thinking budget so the field is null.
  const effort =
    tier === 'balanced' || tier === 'powerful'
      ? predictHead<EffortLevel>(W.effort, vec)
      : null;
  return { tier, effort, route };
}
