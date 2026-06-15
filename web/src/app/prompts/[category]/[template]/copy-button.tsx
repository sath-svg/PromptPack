import Link from "next/link";
import { TRIAL_CTA_HREF } from "@/lib/cta";

// The library pages stay crawlable for SEO, but copying a prompt is gated:
// the button routes into the 3-day trial instead of copying to the clipboard.
// `prompt` is kept in the signature so call sites don't change.
export function CopyPromptButton(_props: { prompt: string }) {
  return (
    <Link
      href={TRIAL_CTA_HREF}
      className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[12px] tracking-[0.04em] text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.05]"
    >
      Copy in Skillset
    </Link>
  );
}
