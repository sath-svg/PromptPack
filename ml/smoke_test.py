"""Smoke-test the trained model on representative prompts."""
import joblib
from pathlib import Path

bundle = joblib.load(Path(__file__).parent / "model.pkl")
vec = bundle["vectorizer"]
tier_clf = bundle["tier_clf"]
effort_clf = bundle["effort_clf"]
route_clf = bundle["route_clf"]

samples = [
    "What is the capital of France?",
    "Define osmosis.",
    "Refactor this Python function to use async/await and add proper error handling for the database connection.",
    "Write a binary search tree implementation in TypeScript with insert, delete, and traverse methods.",
    "Derive a closed-form expression for the Fibonacci sequence using the characteristic equation, then prove it by induction.",
    "translate hello to spanish",
    "Compose a thank-you note to my landlord for fixing the heater quickly.",
    "```python\ndef foo():\n    pass\n```\nAdd type hints and a docstring.",
    "Compare and contrast monolithic and microservice architectures in detail, including operational complexity, deployment, and team scaling tradeoffs.",
    "Who wrote Hamlet?",
    "Step by step, walk me through how to architect a production-ready event-sourced order pipeline with idempotency, retries, and exactly-once delivery guarantees.",
    "Summarize this paragraph: The quick brown fox jumps over the lazy dog.",
]

X = vec.transform(samples)
tiers = tier_clf.predict(X)
efforts = effort_clf.predict(X)
routes = route_clf.predict(X)
for s, t, e, r in zip(samples, tiers, efforts, routes):
    short = (s[:60] + "...") if len(s) > 60 else s
    print(f"[{t:>8}] [{e:>6}] [{r:>8}]  {short}")
