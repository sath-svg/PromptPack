"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { SkillsetShell } from "@/components/skillset-shell";

export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    void signOut({ redirectUrl: "/" });
  }, [signOut]);

  return (
    <SkillsetShell showNav={false}>
      <section className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#2563EB]" />
        <h1 className="mt-6 text-[18px] font-medium text-zinc-50">Signing you out…</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          You can close this tab if it doesn&apos;t redirect automatically.
        </p>
      </section>
    </SkillsetShell>
  );
}
