"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { SkillsetShell } from "@/components/skillset-shell";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setLoading(true);
    setError(null);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("reset");
    } catch (err) {
      const msg =
        (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
        "Could not send reset code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
        router.refresh();
      } else {
        setError("Reset incomplete. Try again.");
      }
    } catch (err) {
      const msg =
        (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
        "Reset failed. Check the code and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SkillsetShell showHalo>
      <section className="relative mx-auto flex min-h-[calc(100dvh-65px)] max-w-[440px] items-center justify-center px-6 py-16">
        <div className="w-full">
          <p
            className="mb-3 text-center text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Reset password
          </p>
          <h1 className="mb-10 text-center text-[32px] font-medium tracking-[-0.02em] text-zinc-50">
            {step === "request" ? "Forgot your password?" : "Set a new password."}
          </h1>

          <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            {step === "request" ? (
              <form onSubmit={requestCode} className="flex flex-col gap-4">
                <p className="text-[14px] leading-[1.55] text-zinc-400">
                  Enter the email address linked to your Skillset account. We&apos;ll send you a 6-digit code.
                </p>
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@skillset.so"
                  autoComplete="email"
                  required
                />

                {error && (
                  <p
                    className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-2 text-[13px] text-red-300"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!isLoaded || loading}
                  style={{ padding: "11px 22px" }}
                  className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send reset code"}
                  {!loading && (
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={reset} className="flex flex-col gap-4">
                <p className="text-[14px] leading-[1.55] text-zinc-400">
                  We sent a 6-digit code to{" "}
                  <span className="text-zinc-200">{email}</span>. Enter the code and your new password below.
                </p>
                <Field
                  label="Verification code"
                  type="text"
                  value={code}
                  onChange={setCode}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  required
                />
                <Field
                  label="New password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />

                {error && (
                  <p
                    className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-2 text-[13px] text-red-300"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!isLoaded || loading}
                  style={{ padding: "11px 22px" }}
                  className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Resetting…" : "Reset password"}
                  {!loading && (
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setCode("");
                    setPassword("");
                    setError(null);
                  }}
                  className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  ← Use a different email
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-[14px] text-zinc-400">
            Remembered it?{" "}
            <Link
              href="/sign-in"
              className="text-[#7BA7FF] transition-colors hover:text-[#2563EB]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </SkillsetShell>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span
        className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-[#0a0a0c] px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
      />
    </label>
  );
}
