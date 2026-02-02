"use client";

/**
 * Desktop Callback page
 *
 * This page should never actually be shown - the Tauri desktop app
 * intercepts the navigation to this URL and extracts the token.
 *
 * If this page is displayed, it means something went wrong with the
 * interception (e.g., user opened the link in a regular browser).
 */
export default function DesktopCallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="text-green-500 text-5xl mb-4">✓</div>
      <h1 className="text-xl font-semibold text-foreground mb-2">
        Authentication Complete
      </h1>
      <p className="text-muted-foreground text-center mb-6">
        You can close this window and return to the PromptPack desktop app.
      </p>
      <p className="text-sm text-muted-foreground/60">
        If you&apos;re seeing this in a regular browser, please open the link in the PromptPack app.
      </p>
    </div>
  );
}
