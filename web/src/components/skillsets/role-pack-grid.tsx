"use client";

import { useState } from "react";
import type { SkillsetPack } from "@/lib/pseo/skillset-packs";
import {
  PersonaCardView,
  type PersonaCard,
  type PersonaIconName,
} from "./persona-card";
import { PackPreviewModal } from "./pack-preview-modal";

interface Props {
  roleLabel: string;
  packs: SkillsetPack[];
}

/**
 * Render every Skillset pack tagged for the given role. Each card has
 * Preview + Download .skill buttons. Preview opens a modal listing all
 * prompts; Download fetches the pre-built `.skill` JSON.
 *
 * Silently renders nothing when the role has no packs — keeps role-page
 * layout clean during the manifest rollout.
 */
export function RolePackGrid({ roleLabel, packs }: Props) {
  const [activePack, setActivePack] = useState<SkillsetPack | null>(null);

  if (packs.length === 0) return null;

  return (
    <section className="mt-20">
      <header className="mb-8">
        <p
          className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Skillsets · ready to import
        </p>
        <h2 className="text-[28px] font-medium leading-[1.1] tracking-[-0.015em] text-zinc-50 md:text-[36px]">
          Skillsets for {roleLabel.toLowerCase()}
        </h2>
        <p className="mt-3 max-w-[60ch] text-[14.5px] leading-[1.6] text-zinc-400">
          {packs.length} role-tuned bundle{packs.length === 1 ? "" : "s"}.
          Download the .skill file and import it once — runs across ChatGPT,
          Claude, Gemini, Cursor, and Copilot.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
        {packs.map((pack) => {
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
          return (
            <PersonaCardView
              key={pack.id}
              persona={persona}
              onPreview={() => setActivePack(pack)}
            />
          );
        })}
      </div>

      <PackPreviewModal pack={activePack} onClose={() => setActivePack(null)} />
    </section>
  );
}
