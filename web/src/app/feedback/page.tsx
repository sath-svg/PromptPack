import type { Metadata } from "next";
import { SkillsetShell } from "@/components/skillset-shell";
import { FiderEmbed } from "@/components/featurebase-embed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feedback & Roadmap — Skillset",
  description:
    "Suggest features, vote on the roadmap, and follow what's shipping next.",
  robots: { index: true, follow: true },
};

// Self-hosted Fider instance — deploy via Coolify, point a subdomain at it
// (e.g. feedback.skillset.so) and set FIDER_URL in web env.
const FIDER_URL = process.env.NEXT_PUBLIC_FIDER_URL || "https://feedback.skillset.so";

export default function FeedbackPage() {
  return (
    <SkillsetShell showHalo>
      <section className="mx-auto max-w-[1100px] px-6 py-16 md:py-20">
        <header className="mb-10 text-center">
          <p
            className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Feedback
          </p>
          <h1 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[44px]">
            Build Skillset with us.
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.6] text-zinc-400">
            Suggest features, vote on what matters most, and follow what we're
            shipping next. The most-upvoted ideas get prioritized.
          </p>
        </header>
        <FiderEmbed fiderUrl={FIDER_URL} />
      </section>
    </SkillsetShell>
  );
}
