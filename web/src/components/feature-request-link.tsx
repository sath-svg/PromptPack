"use client";

export function FeatureRequestLink() {
  return (
    <button
      className="upcoming-cta-link"
      onClick={() => window.dispatchEvent(new CustomEvent("open-support"))}
    >
      We&apos;d love to hear it.
    </button>
  );
}
