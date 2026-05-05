import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProCard } from "../pricing/pro-card";
import { SkillsetShell } from "@/components/skillset-shell";

export const dynamic = "force-dynamic";

export default async function SubscribePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/subscribe");
  }

  return (
    <SkillsetShell showHalo>
      <section className="mx-auto max-w-[480px] px-6 py-20 text-center md:py-28">
        <p
          className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Upgrade
        </p>
        <h1 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[44px]">
          Upgrade to Pro.
        </h1>
        <p className="mb-12 mt-4 text-[16px] leading-[1.6] text-zinc-400">
          More prompts, more packs, cloud sync.
        </p>
        <div className="mx-auto max-w-[420px] text-left">
          <ProCard />
        </div>
      </section>
    </SkillsetShell>
  );
}
