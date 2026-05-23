import type { Metadata } from "next";
import Link from "next/link";
import { rolePages } from "@/lib/pseo/roles";
import { SkillsetShell } from "@/components/skillset-shell";
import { SkillsetCta } from "@/components/skillset-cta";
import { PersonaCardView, type PersonaCard, type PersonaIconName } from "@/components/skillsets/persona-card";
import {
  getFeaturedPacks,
  getPacksForRole,
} from "@/lib/pseo/skillset-packs";

const TITLE = "Skillsets for every role — ChatGPT, Claude, Gemini & IDE prompts";
const DESCRIPTION =
  "A Skillset is a portable bundle of role-specific prompts that runs across ChatGPT, Claude, Gemini, Cursor, and Copilot. Pick the Skillset for your role — developers, marketers, designers, PMs, lawyers, accountants, and more.";

export const metadata: Metadata = {
  title: `${TITLE} | Skillset`,
  description: DESCRIPTION,
  alternates: { canonical: "https://skillset.so/skillsets" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://skillset.so/skillsets",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const ROLE_GROUPS: { label: string; slugs: string[] }[] = [
  {
    label: "Tech",
    slugs: ["developers", "data-scientists", "data-analysts", "devops-engineers", "designers"],
  },
  {
    label: "Go-to-market",
    slugs: ["marketers", "salespeople", "content-creators", "recruiters", "hr-professionals"],
  },
  {
    label: "Business & leadership",
    slugs: ["executives", "founders", "consultants", "project-managers", "freelancers"],
  },
  {
    label: "Professional services",
    slugs: ["lawyers", "accountants", "financial-advisors", "realtors"],
  },
  {
    label: "Education & care",
    slugs: ["teachers", "students", "therapists", "nurses", "writers"],
  },
];

export default function SkillsetsPillarPage() {
  const baseUrl = "https://skillset.so";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/skillsets`,
        url: `${baseUrl}/skillsets`,
        name: TITLE,
        description: DESCRIPTION,
        publisher: { "@type": "Organization", name: "Skillset", url: baseUrl },
      },
      {
        "@type": "ItemList",
        name: "Skillsets by role",
        numberOfItems: rolePages.length,
        itemListElement: rolePages.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${baseUrl}/skillsets/for/${r.slug}`,
          name: `Skillset for ${r.role}`,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is a Skillset?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A Skillset is a portable bundle of prompts that runs identically across ChatGPT, Claude, Gemini, Cursor, and Copilot. Configure once; reuse everywhere. Skill Router picks the cheapest capable model per prompt to cut LLM spend by 60–80%.",
            },
          },
          {
            "@type": "Question",
            name: "How is a Skillset different from a custom GPT?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Custom GPTs are locked to OpenAI. A Skillset is portable — the same prompts run in ChatGPT, Claude, Gemini, Grok, DeepSeek, Cursor, and Copilot. One configuration, every tool.",
            },
          },
          {
            "@type": "Question",
            name: "Are Skillsets free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Starter Skillsets are free. Pro ($9/month) unlocks 7 custom packs and version control; Studio unlocks 17 packs, the team marketplace, and shared Skillsets with role-based access.",
            },
          },
        ],
      },
    ],
  };

  return (
    <SkillsetShell showHalo>
      <main className="relative mx-auto max-w-[1100px] px-6 py-20 md:py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <h1 className="text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[56px]">
          Skillsets for every role
        </h1>
        <p className="mt-5 max-w-[68ch] text-[16.5px] leading-[1.65] text-zinc-300">
          A Skillset is a portable bundle of prompts that runs identically across
          ChatGPT, Claude, Gemini, Cursor, and Copilot. Pick yours below — each
          Skillset ships with role-tuned prompts, voice locking, and Skill Router for
          60–80% lower token spend.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/downloads"
            style={{ padding: "12px 24px" }}
            className="rounded-full bg-[#2563EB] text-[14.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:bg-[#1d4ed8]"
          >
            Get Skillset free
          </Link>
          <Link
            href="/pricing"
            style={{ padding: "12px 24px" }}
            className="rounded-full border border-white/10 bg-white/[0.02] text-[14.5px] text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05]"
          >
            See plans
          </Link>
        </div>

        <aside
          className="mt-10 flex items-start gap-3 rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/[0.06] px-5 py-4 text-[13.5px] leading-[1.55] text-zinc-200"
          aria-label="Marketplace availability notice"
        >
          <span aria-hidden className="mt-0.5 text-[16px]">🛍️</span>
          <p>
            All Skillsets on this page are also available inside the{" "}
            <Link
              href="/downloads"
              className="font-medium text-white underline decoration-[#2563EB]/60 underline-offset-2 hover:decoration-white"
            >
              app
            </Link>{" "}
            — open the <span className="font-medium text-white">Marketplace</span>{" "}
            tab to browse, preview, and import them in one click. Verified{" "}
            <span className="font-medium text-white">Skillset Team</span>{" "}
            listings are free.
          </p>
        </aside>

        <FeaturedSkillsetsRail />

        <section className="mt-16 grid grid-cols-2 gap-4 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 md:grid-cols-4">
          {[
            { label: "Roles covered", value: `${rolePages.length}+` },
            { label: "AI tools supported", value: "12" },
            { label: "Avg token saving", value: "70%" },
            { label: "Starter packs", value: "Free" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[28px] font-medium tracking-[-0.02em] text-zinc-50 md:text-[34px]">
                {s.value}
              </div>
              <div
                className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {ROLE_GROUPS.map((group) => {
          const groupRoles = group.slugs
            .map((s) => rolePages.find((r) => r.slug === s))
            .filter((r): r is (typeof rolePages)[number] => Boolean(r));
          if (groupRoles.length === 0) return null;
          return (
            <section key={group.label} className="mt-16">
              <h2
                className="mb-5 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {group.label}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupRoles.map((r) => {
                  const packCount = getPacksForRole(r.slug).length;
                  return (
                    <Link
                      key={r.slug}
                      href={`/skillsets/for/${r.slug}`}
                      className="group flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 transition-all hover:border-white/[0.14] hover:bg-white/[0.025]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[28px]">{r.icon}</span>
                        <span className="text-[16px] font-medium text-zinc-50 group-hover:text-white">
                          Skillset for {r.role}
                        </span>
                      </div>
                      <p className="text-[13.5px] leading-[1.55] text-zinc-400 line-clamp-2">
                        {r.skillsetSubhead ?? r.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                        {packCount > 0 && (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-emerald-300">
                            {packCount} pack{packCount === 1 ? "" : "s"}
                          </span>
                        )}
                        {r.aiAdoptionPct !== undefined && (
                          <span className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-0.5">
                            {r.aiAdoptionPct}% use AI
                          </span>
                        )}
                        {r.hoursSavedPerWeek && (
                          <span className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-0.5">
                            {r.hoursSavedPerWeek}h saved/wk
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        <SkillsetCta
          eyebrow="Get Skillset"
          title="Save your first prompt as a Skillset"
          body="Portable across ChatGPT, Claude, Gemini, Cursor, and Copilot. Free to start."
        />
      </main>
    </SkillsetShell>
  );
}

function FeaturedSkillsetsRail() {
  const featured = getFeaturedPacks().slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <section className="mt-14">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p
            className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Featured Skillsets
          </p>
          <h2 className="text-[22px] font-medium leading-[1.15] tracking-[-0.015em] text-zinc-50 md:text-[28px]">
            Pick one and see Skillset in action.
          </h2>
        </div>
        <span className="hidden text-[12.5px] text-zinc-500 md:inline">
          Free · no card required
        </span>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {featured.map((pack) => {
          const persona: PersonaCard = {
            icon: pack.personaIcon as PersonaIconName,
            role: pack.persona,
            outcome: pack.outcome,
            skillsetTitle: pack.title,
            skillCount: pack.prompts.length,
            type: pack.type,
            preview: pack.preview ?? pack.prompts.slice(0, 5).map((p) => p.label),
            file: `/skillsets/${pack.id}.skill`,
          };
          return <PersonaCardView key={pack.id} persona={persona} />;
        })}
      </div>
    </section>
  );
}
