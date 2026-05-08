"""
Train logistic regression classifier for prompt routing.

Two heads (one shared TF-IDF vectorizer, two LR classifiers):
  1. tier:    fast | balanced | powerful
  2. effort:  low | medium | high   (only consumed when tier in {balanced, powerful};
              "effort" is the universal reasoning-budget knob across o1, GPT-5,
              DeepSeek R1, Gemini Thinking, Claude extended thinking)

Training mix (sources, not output classes):
  - 20% coding prompts   (sahil2801/CodeAlpaca-20k + iamtarun/python_code_instructions_18k_alpaca)
  - 80% non-coding prompts (databricks/databricks-dolly-15k + tatsu-lab/alpaca)

Outputs:
  - ml/model.pkl                 (full sklearn bundle, joblib-compatible)
  - ml/weights.json              (raw weights/intercepts/vocab for TS runtime)
  - ml/metrics.json              (eval scores)
"""

from __future__ import annotations

import json
import random
import re
from pathlib import Path

import joblib
import numpy as np
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).parent
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

TARGET_TOTAL = 20_000
CODING_FRAC = 0.20
NON_CODING_FRAC = 0.80


# ── Heuristic labelers ───────────────────────────────────────────────────────
# The HuggingFace sources don't carry tier labels, so we synthesize them with
# the same rules the existing classifier.ts uses. The LR model then learns a
# *smoother* version of those rules from the actual prompt distribution.

POWERFUL_KEYWORDS = [
    "analyze", "analyse", "refactor", "implement", "architect", "design",
    "debug", "optimize", "optimise", "evaluate", "critique", "compare",
    "contrast", "review", "audit", "investigate", "research", "strategy",
    "algorithm", "complexity", "tradeoff", "security", "scalab",
]
POWERFUL_RX = re.compile(
    r"\b(" + "|".join(POWERFUL_KEYWORDS) +
    r"|explain why|step by step|in detail|comprehensive|thorough|derive|prove)\b",
    re.IGNORECASE,
)
HIGH_EFFORT_RX = re.compile(
    r"\b(step by step|chain of thought|comprehensive|thorough|in detail|"
    r"derive|prove|formal proof|rigorous|exhaustive|end to end|"
    r"multi[- ]?step|deeply analy[sz]e|architect|from scratch|"
    r"production[- ]?ready|edge cases?|invariants?|complexity analy[sz]is)\b",
    re.IGNORECASE,
)
FAST_RX = re.compile(
    r"^(what is|define|list|translate|convert|how many|when (was|did|is)|"
    r"who (is|was|wrote|invented)|what does|give me a (word|synonym|antonym)|"
    r"name \d|spell|what time)\b",
    re.IGNORECASE,
)
CODE_RX = re.compile(r"```|\bdef |\bfunction |\bclass |\bimport |\bconst |\blet |\bvar ")

# Route head — port of `looksLikeAgentTask` + `looksMultiStep` from
# app/src/lib/classifier.ts. Bootstrap labels for the route classifier.
AGENT_INTENT_RX = re.compile(
    r"[\w./\\-]+\.(?:md|py|ts|tsx|js|jsx|json|ya?ml|sh|bash|rs|go|java|cpp|hpp|c|h|cs|rb|php|sql|toml|html|css|scss|sass|svelte|vue|astro|kt|swift|dart|lua|zig)\b"
    r"|\b(?:read|open|edit|modify|refactor|fix|debug|run|test|check|inspect|review|search|grep|find|list|show|cat|tail|head|diff|patch|build|compile|deploy|install)\s+(?:the\s+|my\s+|this\s+|these\s+|all\s+)?[\w./\\-]+"
    r"|\b(?:file|folder|directory|path|repo(?:sitory)?|codebase|workspace|module|package|script|test\s+suite)\b"
    r"|\b(?:write|create|generate|implement|add|delete|remove|rename)\s+(?:a\s+|an\s+|the\s+)?(?:function|class|module|component|test|file|script|interface|type|hook|endpoint|route|migration|model)"
    r"|\b(?:npm|yarn|pnpm|cargo|pip|go\s+(?:build|run|test)|git\s+\w+|docker\s+\w+|kubectl|make|tsc|eslint|prettier)\b"
    r"|\b(?:read_file|write_file|edit_file|grep|glob|bash|lsp_diagnostics)\b",
    re.IGNORECASE,
)
MULTI_STEP_RX = re.compile(
    r"\b(?:then|after\s+that|next\s+step|finally)\b"
    r"|\b(?:step[- ]by[- ]step|multi[- ]?step|in\s+stages)\b"
    r"|\b(?:research(?:\s+\w+){0,3}\s+(?:and|then)\s+(?:write|summari[sz]e|compare|analy[sz]e))\b"
    r"|\b(?:first|1\.|step\s*1).*?(?:then|second|2\.|step\s*2)"
    r"|\b(?:plan(?:\s+(?:out|and))?|outline\s+(?:and|then))\b"
    r"|\b(?:draft|write).*?\b(?:and|then)\b.*?\b(?:edit|polish|refine|review|critique|expand)\b"
    r"|\b(?:fetch|scrape|download|read).*?\b(?:and|then)\b.*?\b(?:summari[sz]e|extract|format|email|send)\b"
    r"|\bcompare\s+(?:and\s+)?contrast\b"
    r"|\bend[- ]to[- ]end\b"
    r"|(?:^|\n)\s*(?:[-*•]|\d+[.)])\s+",
    re.IGNORECASE | re.DOTALL,
)


def label_route(prompt: str) -> str:
    """One of `chat | agent | workflow`. Priority: agent > workflow > chat.

    `agent`    — prompt mentions file paths, code, shell, or FS work.
                 Workspace presence at runtime decides if tools fire.
    `workflow` — multi-step pipeline (≥ 12 words AND multi-step pattern).
    `chat`     — everything else (greetings, lookups, single-paragraph asks)."""
    n_words = len(prompt.split())
    if AGENT_INTENT_RX.search(prompt):
        return "agent"
    if n_words >= 12 and MULTI_STEP_RX.search(prompt):
        return "workflow"
    return "chat"


# Hand-authored seed prompts per route class. These reinforce the
# heuristic on canonical examples so the LR doesn't drift on the
# data-mix ratios in HF datasets.
ROUTE_SEEDS: list[tuple[str, str]] = [
    # chat
    ("What is photosynthesis?", "chat"),
    ("Translate hello to Spanish.", "chat"),
    ("Define osmosis in one sentence.", "chat"),
    ("Who wrote Hamlet?", "chat"),
    ("Hi there!", "chat"),
    ("Thanks for the help earlier.", "chat"),
    ("Explain quantum tunneling like I'm five.", "chat"),
    ("What's the capital of Mongolia?", "chat"),
    ("Tell me a joke about cats.", "chat"),
    ("Compose a thank-you note to my landlord.", "chat"),
    ("Summarize this paragraph: The quick brown fox jumps over the lazy dog.", "chat"),
    ("Write a short poem about autumn.", "chat"),
    ("What's the difference between TCP and UDP?", "chat"),
    ("Recommend three books on stoicism.", "chat"),
    ("How does a CPU pipeline work conceptually?", "chat"),
    # agent
    ("Read package.json and tell me the version.", "agent"),
    ("Refactor the auth.ts module to use async/await.", "agent"),
    ("Edit src/utils.ts and add a debounce helper.", "agent"),
    ("Run npm test and fix the failing assertion.", "agent"),
    ("grep for TODO comments across the repo.", "agent"),
    ("Add a new component called UserCard.tsx.", "agent"),
    ("Open the .env file and show me the keys.", "agent"),
    ("Fix the lint errors in src/.", "agent"),
    ("Build the project and report any TypeScript errors.", "agent"),
    ("Rename the auth module to identity across all files.", "agent"),
    ("Show me the README.", "agent"),
    ("Run cargo check in the api directory.", "agent"),
    ("Search the codebase for `useState` and list each call site.", "agent"),
    ("Add type hints to every function in models.py.", "agent"),
    ("Create a Dockerfile that builds this Node app.", "agent"),
    ("Update the database migration to add a `status` column.", "agent"),
    ("Run the tests, then fix whatever broke.", "agent"),
    ("Find all references to deprecated_helper and replace them.", "agent"),
    ("Generate unit tests for the parse() function in lib/parser.ts.", "agent"),
    ("git status — what's uncommitted?", "agent"),
    # workflow
    ("Research the latest LLM benchmarks then write a 500-word LinkedIn post.", "workflow"),
    ("Outline a five-section blog post on remote work productivity, then draft each section.", "workflow"),
    ("Fetch the contents of this URL and summarize the key arguments.", "workflow"),
    ("Compare and contrast Redux vs Zustand vs Jotai in detail with tradeoffs and a recommendation.", "workflow"),
    ("Draft three subject-line variants then refine the best one and write the email body.", "workflow"),
    ("Step by step, plan a marketing campaign for a B2B SaaS product, including channels, budget, and KPIs.", "workflow"),
    ("Plan out a one-week itinerary for Tokyo with morning, lunch, and evening activities for each day.", "workflow"),
    ("Research the top three competitors in our space, then write a positioning brief.", "workflow"),
    ("First analyze the survey data, then write a summary report with charts described in text.", "workflow"),
    ("Draft and refine a 1000-word essay on the ethics of autonomous vehicles.", "workflow"),
    ("Plan and write a structured 10-question interview with three sample answers per question.", "workflow"),
    ("Outline and then draft a technical RFC for adding rate limiting to our API.", "workflow"),
    ("Research the science of habit formation, then design a 30-day habit tracker template.", "workflow"),
    ("Compare three project-management tools end-to-end across pricing, collaboration, and integrations.", "workflow"),
    ("Brainstorm ten startup ideas in fintech, then pick two and flesh out a one-pager for each.", "workflow"),
]


def label_tier(prompt: str) -> str:
    n_words = len(prompt.split())
    has_code = bool(CODE_RX.search(prompt))
    if has_code or POWERFUL_RX.search(prompt) or n_words > 150:
        return "powerful"
    if n_words < 20 and FAST_RX.search(prompt.strip()):
        return "fast"
    if n_words < 15:
        return "fast"
    return "balanced"


def label_effort(prompt: str, tier: str) -> str:
    """Reasoning effort budget — independent of tier so the model can learn
    that *short prompts can still demand high effort* (e.g. 'prove P=NP') and
    *long prompts can be low effort* (e.g. a verbose lookup question)."""
    n_words = len(prompt.split())
    has_code = bool(CODE_RX.search(prompt))
    powerful_hits = len(POWERFUL_RX.findall(prompt))
    high_hits = len(HIGH_EFFORT_RX.findall(prompt))

    # Strong high-effort signals
    if high_hits >= 1 or powerful_hits >= 2 or n_words > 200:
        return "high"
    # Code + complexity → high
    if has_code and (powerful_hits >= 1 or n_words > 80):
        return "high"
    # Trivial fast lookups → low
    if tier == "fast" and not has_code and powerful_hits == 0:
        return "low"
    # Short, single complex keyword → medium
    if n_words < 30 and powerful_hits <= 1:
        return "medium" if powerful_hits == 1 or has_code else "low"
    # Default mid-range
    if powerful_hits == 0 and not has_code:
        return "low" if n_words < 60 else "medium"
    return "medium"


# ── Data loading ─────────────────────────────────────────────────────────────

def load_non_coding(n: int) -> list[str]:
    """Dolly + Alpaca instruction prompts."""
    out: list[str] = []
    try:
        dolly = load_dataset("databricks/databricks-dolly-15k", split="train")
        for row in dolly:
            inst = (row.get("instruction") or "").strip()
            ctx = (row.get("context") or "").strip()
            text = f"{inst}\n{ctx}".strip() if ctx else inst
            if 3 <= len(text.split()) <= 400:
                out.append(text)
    except Exception as e:
        print(f"[warn] dolly load failed: {e}")

    try:
        alpaca = load_dataset("tatsu-lab/alpaca", split="train")
        for row in alpaca:
            inst = (row.get("instruction") or "").strip()
            inp = (row.get("input") or "").strip()
            text = f"{inst}\n{inp}".strip() if inp else inst
            if 3 <= len(text.split()) <= 400:
                out.append(text)
    except Exception as e:
        print(f"[warn] alpaca load failed: {e}")

    random.shuffle(out)
    return out[:n]


def load_coding(n: int) -> list[str]:
    """Code-related instruction prompts."""
    out: list[str] = []
    try:
        # sahil2801/CodeAlpaca-20k — instruction-style coding prompts
        ds = load_dataset("sahil2801/CodeAlpaca-20k", split="train")
        for row in ds:
            inst = (row.get("instruction") or "").strip()
            inp = (row.get("input") or "").strip()
            text = f"{inst}\n{inp}".strip() if inp else inst
            if 3 <= len(text.split()) <= 400:
                out.append(text)
    except Exception as e:
        print(f"[warn] CodeAlpaca load failed: {e}")

    if len(out) < n:
        try:
            ds = load_dataset("iamtarun/python_code_instructions_18k_alpaca", split="train")
            for row in ds:
                inst = (row.get("instruction") or "").strip()
                inp = (row.get("input") or "").strip()
                text = f"{inst}\n{inp}".strip() if inp else inst
                if 3 <= len(text.split()) <= 400:
                    out.append(text)
        except Exception as e:
            print(f"[warn] python_code_instructions load failed: {e}")

    random.shuffle(out)
    return out[:n]


# ── Train ────────────────────────────────────────────────────────────────────

def build_dataset() -> tuple[list[str], list[str], list[str], list[str]]:
    n_code = int(TARGET_TOTAL * CODING_FRAC)
    n_non = TARGET_TOTAL - n_code

    print(f"loading {n_non} non-coding + {n_code} coding prompts...")
    non_coding = load_non_coding(n_non)
    coding = load_coding(n_code)
    print(f"got {len(non_coding)} non-coding, {len(coding)} coding")

    texts: list[str] = []
    tier_labels: list[str] = []
    effort_labels: list[str] = []
    route_labels: list[str] = []

    for t in non_coding + coding:
        ti = label_tier(t)
        ef = label_effort(t, ti)
        rt = label_route(t)
        texts.append(t)
        tier_labels.append(ti)
        effort_labels.append(ef)
        route_labels.append(rt)

    # Append the hand-authored route seeds. Heuristic-bootstrapped HF data
    # is heavy on `chat` and `agent`; seeds backstop `workflow` which is
    # rare in those datasets and easy for the LR to underfit.
    for prompt, route in ROUTE_SEEDS:
        texts.append(prompt)
        tier_labels.append(label_tier(prompt))
        effort_labels.append(label_effort(prompt, tier_labels[-1]))
        route_labels.append(route)

    idx = list(range(len(texts)))
    random.shuffle(idx)
    texts = [texts[i] for i in idx]
    tier_labels = [tier_labels[i] for i in idx]
    effort_labels = [effort_labels[i] for i in idx]
    route_labels = [route_labels[i] for i in idx]
    return texts, tier_labels, effort_labels, route_labels


def train():
    texts, tier, effort, route = build_dataset()

    from collections import Counter
    print("tier dist:  ", Counter(tier))
    print("effort dist:", Counter(effort))
    print("route dist: ", Counter(route))

    X_train, X_test, t_train, t_test, e_train, e_test, r_train, r_test = train_test_split(
        texts, tier, effort, route, test_size=0.15, random_state=SEED, stratify=tier
    )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=3,
        max_df=0.9,
        max_features=8000,
        sublinear_tf=True,
        lowercase=True,
    )

    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    tier_clf = LogisticRegression(max_iter=1000, C=1.0, class_weight="balanced")
    tier_clf.fit(X_train_vec, t_train)

    effort_clf = LogisticRegression(max_iter=1000, C=1.0, class_weight="balanced")
    effort_clf.fit(X_train_vec, e_train)

    route_clf = LogisticRegression(max_iter=1000, C=1.0, class_weight="balanced")
    route_clf.fit(X_train_vec, r_train)

    tier_pred = tier_clf.predict(X_test_vec)
    effort_pred = effort_clf.predict(X_test_vec)
    route_pred = route_clf.predict(X_test_vec)

    tier_report = classification_report(t_test, tier_pred, output_dict=True, zero_division=0)
    effort_report = classification_report(e_test, effort_pred, output_dict=True, zero_division=0)
    route_report = classification_report(r_test, route_pred, output_dict=True, zero_division=0)

    print("\n--- tier ---")
    print(classification_report(t_test, tier_pred, zero_division=0))
    print("--- effort ---")
    print(classification_report(e_test, effort_pred, zero_division=0))
    print("--- route ---")
    print(classification_report(r_test, route_pred, zero_division=0))

    bundle = {
        "vectorizer": vectorizer,
        "tier_clf": tier_clf,
        "effort_clf": effort_clf,
        "route_clf": route_clf,
    }
    pkl_path = ROOT / "model.pkl"
    joblib.dump(bundle, pkl_path)
    print(f"\nsaved: {pkl_path}")

    weights_path = ROOT / "weights.json"
    export_weights(vectorizer, tier_clf, effort_clf, route_clf, weights_path)
    print(f"saved: {weights_path}")

    metrics_path = ROOT / "metrics.json"
    metrics_path.write_text(json.dumps(
        {"tier": tier_report, "effort": effort_report, "route": route_report,
         "n_train": len(X_train), "n_test": len(X_test)},
        indent=2,
    ))
    print(f"saved: {metrics_path}")


def export_weights(
    vectorizer: TfidfVectorizer,
    tier_clf: LogisticRegression,
    effort_clf: LogisticRegression,
    route_clf: LogisticRegression,
    out_path: Path,
) -> None:
    """Export weights in a format the TS runtime can consume.

    Schema:
      {
        "vocab": {token: index, ...},
        "idf":   [float, ...]                     # length = vocab_size
        "ngram_range": [1, 2],
        "tier":    { "classes": [...], "coef": [[...], ...], "intercept": [...] },
        "effort":  { "classes": [...], "coef": [[...], ...], "intercept": [...] },
        "route":   { "classes": [...], "coef": [[...], ...], "intercept": [...] }
      }
    """
    vocab: dict[str, int] = {tok: int(i) for tok, i in vectorizer.vocabulary_.items()}
    idf: list[float] = vectorizer.idf_.tolist()

    payload = {
        "vocab": vocab,
        "idf": idf,
        "ngram_range": list(vectorizer.ngram_range),
        "sublinear_tf": bool(vectorizer.sublinear_tf),
        "lowercase": bool(vectorizer.lowercase),
        "tier": {
            "classes": tier_clf.classes_.tolist(),
            "coef": tier_clf.coef_.tolist(),
            "intercept": tier_clf.intercept_.tolist(),
        },
        "effort": {
            "classes": effort_clf.classes_.tolist(),
            "coef": effort_clf.coef_.tolist(),
            "intercept": effort_clf.intercept_.tolist(),
        },
        "route": {
            "classes": route_clf.classes_.tolist(),
            "coef": route_clf.coef_.tolist(),
            "intercept": route_clf.intercept_.tolist(),
        },
    }
    out_path.write_text(json.dumps(payload))


if __name__ == "__main__":
    train()
