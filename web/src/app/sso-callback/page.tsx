"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { SkillsetShell } from "@/components/skillset-shell";

export default function SSOCallbackPage() {
  return (
    <SkillsetShell showNav={false}>
      <section className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#2563EB]" />
        <h1 className="mt-6 text-[20px] font-medium text-zinc-50">Finishing sign-in…</h1>
        <p className="mt-2 max-w-[40ch] text-[14px] text-zinc-400">
          Completing your authentication. You&apos;ll be redirected in a moment.
        </p>
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        />
      </section>
    </SkillsetShell>
  );
}
