"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    void signOut({ redirectUrl: "/" });
  }, [signOut]);

  return (
    <main style={{ padding: "32px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "18px", marginBottom: "8px" }}>Signing you out…</h1>
      <p style={{ color: "rgba(0,0,0,0.6)" }}>
        You can close this tab if it doesn&apos;t redirect automatically.
      </p>
    </main>
  );
}
