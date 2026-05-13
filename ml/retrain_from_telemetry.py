"""
Retrain the route head with augmented labels from real-user telemetry.

Workflow
--------
1. From the desktop app's devtools console (or the Settings export
   button once shipped), run:

       const rows = await window.__TAURI__.core.invoke('telemetry_export_route', {
         input: { only_signaled: true, limit: 50000 },
       });
       console.log(JSON.stringify(rows));

   Save the output to `ml/telemetry_export.jsonl` (one row per line)
   or `ml/telemetry_export.json` (the array literal).

2. Run:

       python retrain_from_telemetry.py [path]

   `path` defaults to `ml/telemetry_export.json`.

3. Inspect the report. New weights are written to `ml/weights.json`,
   the joblib bundle to `ml/model.pkl`, metrics to `ml/metrics.json`.
   Copy `ml/weights.json` to `app/src/lib/classifier-weights.json`.

Label derivation
----------------
Each telemetry row has:
  - prompt
  - predicted_route          (LR's pick at the time)
  - confidence               (LR's softmax top-class probability)
  - fallback_used            (1 if Phase 3 LLM tiebreaker fired)
  - fallback_route           (LLM's verdict)
  - actual_route             (path the dispatcher actually took — may
                              differ from predicted, e.g. agent gated
                              behind workspace presence)
  - completed                (+1 success, -1 failed, null pending)
  - reprompt_within          (seconds until next user message)
  - user_signal              ('thumbs_up' | 'thumbs_down' | null)

Truth-label rules (priority top → bottom):

  1. user_signal == 'thumbs_up'
     → label = predicted_route. User confirmed.

  2. user_signal == 'thumbs_down' AND fallback_used
     → label = fallback_route. LLM tiebreaker is the next-best signal.

  3. user_signal == 'thumbs_down' (no fallback)
     → discard. Ambiguous — we don't know what the right answer was.

  4. fallback_used AND fallback_route != predicted_route
     → label = fallback_route. LLM disagreed; LLM wins by default since
       it has more context than LR.

  5. completed == -1 (failed/cancelled) AND no signal
     → discard. Failure could be unrelated (network, tools).

  6. reprompt_within < 30 (no thumbs)
     → soft negative; discard for v1 (could downweight in v2).

  7. otherwise (unsignaled positive — completed=1, no thumbs, no fast
     reprompt)
     → label = predicted_route, but downweighted (sample_weight=0.3) so
       the head doesn't just memorize its own past predictions.

Bootstrap labels from `train_classifier.build_dataset()` are kept at
sample_weight=1.0; signaled rows go in at 1.5 (strong); unsignaled
positives at 0.3.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

# Reuse base-dataset builder + label heuristics + ROUTE_SEEDS.
from train_classifier import (
    SEED,
    build_dataset,
    label_effort,
    label_tier,
)

ROOT = Path(__file__).parent
DEFAULT_EXPORT = ROOT / "telemetry_export.json"


def _load_telemetry(path: Path) -> list[dict]:
    if not path.exists():
        return []
    text = path.read_text()
    text = text.strip()
    if not text:
        return []
    # Accept either a JSON array or JSONL.
    if text.startswith("["):
        return json.loads(text)
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        rows.append(json.loads(line))
    return rows


def _derive_label(row: dict) -> tuple[str | None, float]:
    """Return (label, sample_weight) per the rules in the docstring.

    label = None means "discard this row"."""
    predicted = row.get("predicted_route")
    fallback_used = bool(row.get("fallback_used"))
    fallback = row.get("fallback_route")
    completed = row.get("completed")
    reprompt = row.get("reprompt_within")
    signal = row.get("user_signal")

    if signal == "thumbs_up":
        return predicted, 1.5
    if signal == "thumbs_down":
        if fallback_used and fallback:
            return fallback, 1.5
        return None, 0.0
    if fallback_used and fallback and fallback != predicted:
        return fallback, 1.0
    if completed == -1:
        return None, 0.0
    if reprompt is not None and reprompt < 30:
        return None, 0.0
    if completed == 1:
        return predicted, 0.3
    return None, 0.0


def main() -> int:
    export_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_EXPORT
    print(f"loading telemetry from {export_path}")
    telemetry = _load_telemetry(export_path)
    print(f"  → {len(telemetry)} rows")

    # ── Base dataset (unchanged HF + seeds) ───────────────────────────
    print("building base dataset (HF + ROUTE_SEEDS)...")
    base_texts, base_tier, base_effort, base_route = build_dataset()
    base_weights = [1.0] * len(base_texts)

    # ── Telemetry-augmented rows ──────────────────────────────────────
    aug_texts: list[str] = []
    aug_tier: list[str] = []
    aug_effort: list[str] = []
    aug_route: list[str] = []
    aug_weights: list[float] = []

    discarded = Counter()
    accepted = Counter()
    for row in telemetry:
        prompt = (row.get("prompt") or "").strip()
        if not prompt or len(prompt.split()) < 2:
            discarded["empty_or_too_short"] += 1
            continue
        label, weight = _derive_label(row)
        if label is None or weight <= 0:
            discarded["no_signal"] += 1
            continue
        ti = label_tier(prompt)
        ef = label_effort(prompt, ti)
        aug_texts.append(prompt)
        aug_tier.append(ti)
        aug_effort.append(ef)
        aug_route.append(label)
        aug_weights.append(weight)
        accepted[label] += 1

    print(f"  accepted: {dict(accepted)}")
    print(f"  discarded: {dict(discarded)}")

    # ── Combine ───────────────────────────────────────────────────────
    texts = base_texts + aug_texts
    tier = base_tier + aug_tier
    effort = base_effort + aug_effort
    route = base_route + aug_route
    weights = base_weights + aug_weights

    print("\nfinal dist:")
    print("  tier:   ", Counter(tier))
    print("  effort: ", Counter(effort))
    print("  route:  ", Counter(route))

    # ── Train ─────────────────────────────────────────────────────────
    (
        X_train,
        X_test,
        t_train,
        t_test,
        e_train,
        e_test,
        r_train,
        r_test,
        w_train,
        _w_test,
    ) = train_test_split(
        texts,
        tier,
        effort,
        route,
        weights,
        test_size=0.15,
        random_state=SEED,
        stratify=tier,
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

    sw = np.array(w_train, dtype=float)

    tier_clf = LogisticRegression(max_iter=1000, C=1.0, class_weight="balanced")
    tier_clf.fit(X_train_vec, t_train, sample_weight=sw)

    effort_clf = LogisticRegression(max_iter=1000, C=1.0, class_weight="balanced")
    effort_clf.fit(X_train_vec, e_train, sample_weight=sw)

    route_clf = LogisticRegression(max_iter=1000, C=1.0, class_weight="balanced")
    route_clf.fit(X_train_vec, r_train, sample_weight=sw)

    tier_pred = tier_clf.predict(X_test_vec)
    effort_pred = effort_clf.predict(X_test_vec)
    route_pred = route_clf.predict(X_test_vec)

    print("\n--- tier ---")
    print(classification_report(t_test, tier_pred, zero_division=0))
    print("--- effort ---")
    print(classification_report(e_test, effort_pred, zero_division=0))
    print("--- route ---")
    print(classification_report(r_test, route_pred, zero_division=0))

    # ── Save ──────────────────────────────────────────────────────────
    bundle = {
        "vectorizer": vectorizer,
        "tier_clf": tier_clf,
        "effort_clf": effort_clf,
        "route_clf": route_clf,
    }
    joblib.dump(bundle, ROOT / "model.pkl")
    print(f"saved: {ROOT / 'model.pkl'}")

    payload = {
        "vocab": {tok: int(i) for tok, i in vectorizer.vocabulary_.items()},
        "idf": vectorizer.idf_.tolist(),
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
    (ROOT / "weights.json").write_text(json.dumps(payload))
    print(f"saved: {ROOT / 'weights.json'}")

    metrics = {
        "tier": classification_report(t_test, tier_pred, output_dict=True, zero_division=0),
        "effort": classification_report(e_test, effort_pred, output_dict=True, zero_division=0),
        "route": classification_report(r_test, route_pred, output_dict=True, zero_division=0),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "n_telemetry_rows": len(telemetry),
        "n_telemetry_accepted": sum(accepted.values()),
        "telemetry_discard_reasons": dict(discarded),
        "telemetry_accepted_per_route": dict(accepted),
    }
    (ROOT / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"saved: {ROOT / 'metrics.json'}")

    print(
        "\nNext: copy ml/weights.json → app/src/lib/classifier-weights.json "
        "to ship the retrained model.",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
