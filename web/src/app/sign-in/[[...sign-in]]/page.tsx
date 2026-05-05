"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/types";
import { ArrowRight } from "lucide-react";
import { SkillsetShell } from "@/components/skillset-shell";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError("Additional verification required. Use the form on Clerk's hosted page.");
      }
    } catch (err) {
      const msg =
        (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
        "Sign-in failed. Check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (strategy: OAuthStrategy) => {
    if (!isLoaded) return;
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectUrl,
      });
    } catch (err) {
      const msg =
        (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
        "OAuth failed.";
      setError(msg);
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
            Sign in
          </p>
          <h1 className="mb-10 text-center text-[32px] font-medium tracking-[-0.02em] text-zinc-50">
            Welcome back to Skillset.
          </h1>

          <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex flex-col gap-2.5">
              <OAuthButton
                onClick={() => oauth("oauth_google")}
                disabled={!isLoaded || loading}
                label="Continue with Google"
                icon={<GoogleIcon />}
              />
              <OAuthButton
                onClick={() => oauth("oauth_github")}
                disabled={!isLoaded || loading}
                label="Continue with GitHub"
                icon={<GithubIcon />}
              />
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span
                className="text-[10.5px] uppercase tracking-[0.22em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                or with email
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@skillset.so"
                autoComplete="email"
                required
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                trailing={
                  <Link
                    href="/forgot-password"
                    className="text-[12px] text-zinc-500 transition-colors hover:text-[#7BA7FF]"
                  >
                    Forgot?
                  </Link>
                }
              />

              {error && (
                <p
                  className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-2 text-[13px] text-red-300"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div id="clerk-captcha" />

              <button
                type="submit"
                disabled={!isLoaded || loading}
                style={{ padding: "11px 22px" }}
                className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
                {!loading && (
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[14px] text-zinc-400">
            New to Skillset?{" "}
            <Link
              href={`/sign-up${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
              className="text-[#7BA7FF] transition-colors hover:text-[#2563EB]"
            >
              Create an account
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
  trailing,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between">
        <span
          className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {label}
        </span>
        {trailing}
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

function OAuthButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ padding: "10px 18px" }}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] text-[14px] text-zinc-100 transition-all hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-zinc-100" aria-hidden>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.16c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.74-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.13v3.17c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}
