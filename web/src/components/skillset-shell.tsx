import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SkillsetNav } from "@/components/skillset-nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export function SkillsetShell({
  children,
  showNav = true,
  showHalo = false,
  haloPosition = "50% 10%",
}: {
  children: ReactNode;
  showNav?: boolean;
  showHalo?: boolean;
  haloPosition?: string;
}) {
  return (
    <div
      className={`landing-root ${geist.variable} ${geistMono.variable} relative min-h-[100dvh] w-full bg-[#0a0a0c] text-zinc-100`}
      style={{ fontFamily: "var(--font-geist), system-ui, sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        }}
      />
      {showHalo && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px]"
          style={{
            background: `radial-gradient(ellipse 60% 40% at ${haloPosition}, rgba(37,99,235,0.18), transparent 60%)`,
          }}
        />
      )}
      {showNav && <SkillsetNav />}
      {children}
    </div>
  );
}
