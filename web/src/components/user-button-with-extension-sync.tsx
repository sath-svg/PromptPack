"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

/**
 * Wrapper around Clerk's UserButton that syncs logout events with the browser extension
 * Monitors auth state to detect signout and set localStorage flag
 */
export function UserButtonWithExtensionSync() {
  const { userId } = useAuth();

  useEffect(() => {
    // When userId becomes null, user has signed out
    if (userId === null) {
      try {
        localStorage.setItem("pp_extension_logout", "true");
        console.log("[PromptPack] Logout flag set for extension");
      } catch (e) {
        console.error("[PromptPack] Failed to set logout flag:", e);
      }
    }
  }, [userId]);

  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: "w-9 h-9",
        },
      }}
    />
  );
}
