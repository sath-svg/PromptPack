import type { FAQ } from "@/lib/pseo/types";

export function RoleFaq({ faqs, role }: { faqs: FAQ[]; role: string }) {
  return (
    <section className="mt-16">
      <h2
        className="mb-6 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        Frequently asked questions
      </h2>
      <h3 className="sr-only">Skillset for {role} FAQ</h3>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 transition-all open:border-white/[0.12]"
          >
            <summary className="cursor-pointer list-none text-[15.5px] font-medium text-zinc-50 marker:hidden">
              <span className="mr-3 text-[#7BA7FF] transition-transform group-open:rotate-90 inline-block">›</span>
              {faq.question}
            </summary>
            <p className="mt-3 ml-7 max-w-[68ch] text-[14.5px] leading-[1.65] text-zinc-400">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
