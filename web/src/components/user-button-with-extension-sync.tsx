"use client";

import { UserButton } from "@clerk/nextjs";

/**
 * Wrapper around Clerk's UserButton that syncs logout events with the browser extension
 * Uses UserButton's afterSignOutCallback to set a localStorage flag
 */
export function UserButtonWithExtensionSync() {
  const handleSignOut = () => {
    // Set logout flag for extension to detect
    try {
      localStorage.setItem("pp_extension_logout", "true");
      console.log("[PromptPack] Logout flag set for extension");
    } catch (e) {
      console.error("[PromptPack] Failed to set logout flag:", e);
    }
  };

  return (
    <UserButton
      afterSignOutUrl="/"
      afterSignOutCallback={handleSignOut}
      appearance={{
        elements: {
          avatarBox: "w-9 h-9",
        },
      }}
    />
  );
}
