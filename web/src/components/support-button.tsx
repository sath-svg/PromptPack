"use client";

export function SupportButton() {
  return (
    <a
      href="mailto:support@pmtpk.ai?subject=PromptPack Support"
      title="Contact Support"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: "var(--accent)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "transform 0.2s, box-shadow 0.2s",
        zIndex: 1000,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </a>
  );
}
