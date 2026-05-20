"use client";

interface Props {
  fiderUrl: string;
}

/**
 * Fider feedback board, iframed. Fider runs as a self-hosted service
 * (Docker on Coolify) and serves its own UI. We iframe the root so users
 * see the board embedded inside the Skillset site shell.
 *
 * Auth: Fider has its own session/cookie. Users sign in once on the Fider
 * subdomain (e.g. feedback.skillset.so) via Google OAuth or email link.
 * We could add a SSO bridge to BetterAuth later; for now the standalone
 * Fider session is simpler.
 */
export function FiderEmbed({ fiderUrl }: Props) {
  return (
    <iframe
      src={fiderUrl}
      title="Skillset feedback board"
      style={{
        width: "100%",
        minHeight: "80vh",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "0.75rem",
        background: "#0a0a0a",
      }}
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
}
