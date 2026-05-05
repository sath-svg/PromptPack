import type { ReactNode } from "react";

export function SkillsetPageHeader({
  eyebrow,
  title,
  description,
  align = "center",
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  children?: ReactNode;
}) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <div className={`mb-14 ${alignClass}`}>
      {eyebrow && (
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {eyebrow}
        </p>
      )}
      <h1 className="text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[56px]">
        {title}
      </h1>
      {description && (
        <p
          className={`mt-5 max-w-[60ch] text-[16px] leading-[1.6] text-zinc-400 ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
