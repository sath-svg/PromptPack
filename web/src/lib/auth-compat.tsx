"use client";

/**
 * BetterAuth compatibility layer for Clerk imports.
 * Drop-in replacement: change import path from "@clerk/nextjs" to "@/lib/auth-compat"
 * Keeps same API surface so 20+ component files need minimal changes.
 */

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createAuthClient } from "better-auth/react";

// ---- BetterAuth Client ----

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "https://skillset.so",
});

// ---- Session Context ----

interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  } | null;
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  } | null;
  isPending: boolean;
}

const AuthContext = createContext<AuthSession>({
  user: null,
  session: null,
  isPending: true,
});

// ---- Provider (replaces ClerkProvider) ----

export function AuthProvider({ children }: { children: ReactNode }) {
  // Skip authClient.useSession() — its nanostore-based atom never repopulated
  // after the BetterAuth migration, so SignedIn/SignedOut always read null and
  // the navbar stayed on "Sign in" even with a valid session_token cookie.
  // A direct fetch of /api/auth/get-session works (verified server-side) and
  // is what the rest of the app already shapes itself around.
  const [data, setData] = useState<{ user: AuthSession["user"]; session: AuthSession["session"] } | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    fetch("/api/auth/get-session", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.user && json?.session) {
          setData({
            user: { ...json.user, image: json.user.image ?? undefined },
            session: { ...json.session, expiresAt: new Date(json.session.expiresAt) },
          });
        }
        setIsPending(false);
      })
      .catch(() => {
        setIsPending(false);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        session: data?.session ?? null,
        isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hooks (replaces useAuth, useUser, useClerk) ----

export function useAuth() {
  const { user, session, isPending } = useContext(AuthContext);

  return {
    isLoaded: !isPending,
    isSignedIn: !!session,
    userId: user?.id ?? null,
    sessionId: session?.id ?? null,
    getToken: async () => session?.token ?? null, // BetterAuth session token
    signOut: () => authClient.signOut(),
  };
}

export function useUser() {
  const { user, isPending } = useContext(AuthContext);

  return {
    isLoaded: !isPending,
    user: user
      ? {
          id: user.id,
          fullName: user.name,
          primaryEmailAddress: {
            emailAddress: user.email,
          },
          imageUrl: user.image,
        }
      : null,
  };
}

export function useClerk() {
  return {
    signOut: async ({ redirectUrl }: { redirectUrl?: string } = {}) => {
      await authClient.signOut();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
  };
}

// ---- Components (replaces SignedIn, SignedOut, SignIn, SignUp, etc.) ----

export function SignedIn({ children }: { children: ReactNode }) {
  const { session, isPending } = useContext(AuthContext);
  if (isPending || !session) return null;
  return <>{children}</>;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { session, isPending } = useContext(AuthContext);
  if (isPending || session) return null;
  return <>{children}</>;
}

export function SignInButton({
  children,
  mode,
}: {
  children: ReactNode;
  mode?: "modal" | "redirect";
}) {
  const handleClick = () => {
    window.location.href = "/sign-in";
  };

  return (
    <span onClick={handleClick} style={{ cursor: "pointer" }}>
      {children}
    </span>
  );
}

export function SignUpButton({
  children,
  mode,
}: {
  children: ReactNode;
  mode?: "modal" | "redirect";
}) {
  const handleClick = () => {
    window.location.href = "/sign-up";
  };

  return (
    <span onClick={handleClick} style={{ cursor: "pointer" }}>
      {children}
    </span>
  );
}

export function SignIn({ callbackURL }: { callbackURL?: string } = {}) {
  // Render BetterAuth sign-in form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo = callbackURL || "/";

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message || "Sign in failed");
      setLoading(false);
    } else {
      window.location.href = redirectTo;
    }
  };

  const handleGoogleSignIn = () => {
    authClient.signIn.social({ provider: "google", callbackURL: redirectTo });
  };

  const handleFacebookSignIn = () => {
    authClient.signIn.social({ provider: "facebook", callbackURL: redirectTo });
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      <h2 style={{ marginBottom: 16, fontSize: 24, fontWeight: 600 }}>Sign In</h2>

      <button
        onClick={handleGoogleSignIn}
        className="btn btn-secondary"
        style={{ width: "100%", marginBottom: 8, padding: "10px 16px" }}
      >
        Continue with Google
      </button>

      <button
        onClick={handleFacebookSignIn}
        className="btn btn-secondary"
        style={{ width: "100%", marginBottom: 16, padding: "10px 16px" }}
      >
        Continue with Facebook
      </button>

      <div style={{ textAlign: "center", margin: "12px 0", color: "#666", fontSize: 14 }}>
        or
      </div>

      <form onSubmit={handleEmailSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 8,
            borderRadius: 6,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "#fff",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "#fff",
          }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 8 }}>{error}</p>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", padding: "10px 16px" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14, color: "#888", textAlign: "center" }}>
        Don&apos;t have an account?{" "}
        <a href="/sign-up" style={{ color: "#2563eb" }}>
          Sign up
        </a>
      </p>
    </div>
  );
}

export function SignUp({ callbackURL }: { callbackURL?: string } = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo = callbackURL || "/";

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    if (error) {
      setError(error.message || "Sign up failed");
      setLoading(false);
    } else {
      window.location.href = redirectTo;
    }
  };

  const handleGoogleSignUp = () => {
    authClient.signIn.social({ provider: "google", callbackURL: redirectTo });
  };

  const handleFacebookSignUp = () => {
    authClient.signIn.social({ provider: "facebook", callbackURL: redirectTo });
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      <h2 style={{ marginBottom: 16, fontSize: 24, fontWeight: 600 }}>Sign Up</h2>

      <button
        onClick={handleGoogleSignUp}
        className="btn btn-secondary"
        style={{ width: "100%", marginBottom: 8, padding: "10px 16px" }}
      >
        Continue with Google
      </button>

      <button
        onClick={handleFacebookSignUp}
        className="btn btn-secondary"
        style={{ width: "100%", marginBottom: 16, padding: "10px 16px" }}
      >
        Continue with Facebook
      </button>

      <div style={{ textAlign: "center", margin: "12px 0", color: "#666", fontSize: 14 }}>
        or
      </div>

      <form onSubmit={handleEmailSignUp}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 8,
            borderRadius: 6,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "#fff",
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 8,
            borderRadius: 6,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "#fff",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "#fff",
          }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 8 }}>{error}</p>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", padding: "10px 16px" }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14, color: "#888", textAlign: "center" }}>
        Already have an account?{" "}
        <a href="/sign-in" style={{ color: "#2563eb" }}>
          Sign in
        </a>
      </p>
    </div>
  );
}

// ---- UserButton (replaces Clerk's UserButton) ----

type Plan = "free" | "pro" | "studio";

const TIER_LIMITS: Record<Plan, { promptLimit: number; packLimit: number }> = {
  free: { promptLimit: 10, packLimit: 2 },
  pro: { promptLimit: 40, packLimit: 5 },
  studio: { promptLimit: 200, packLimit: 10 },
};

export function UserButton({
  afterSignOutUrl,
  appearance,
}: {
  afterSignOutUrl?: string;
  appearance?: any;
}) {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Lazy-fetch billing plan once dropdown opens
  useEffect(() => {
    if (!open || plan || planLoading) return;
    setPlanLoading(true);
    fetch("/api/auth/billing-status", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        const p = (j?.plan as Plan) || "free";
        setPlan(p);
      })
      .catch(() => setPlan("free"))
      .finally(() => setPlanLoading(false));
  }, [open, plan, planLoading]);

  if (!user) return null;

  const initials = (user.name || user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const limits = TIER_LIMITS[plan ?? "free"];
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "...";

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "2px solid #333",
          background: user.image ? `url(${user.image}) center/cover` : "#2563eb",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!user.image && initials}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            background: "#0f0f0f",
            border: "1px solid #1f1f1f",
            borderRadius: 12,
            padding: 14,
            width: 280,
            zIndex: 100,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          {/* Header: title + synced badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Account</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#22c55e", fontSize: 12 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Synced
            </span>
          </div>

          {/* Identity row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || user.email}
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {initials}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              {user.name && (
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>
                {planLoading && !plan ? "Loading..." : `${planLabel} Plan`}
              </div>
            </div>
          </div>

          {/* Limits panel */}
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#999" }}>Skill Limit</span>
              <span style={{ color: "#fff" }}>{limits.promptLimit}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#999" }}>Skillset Limit</span>
              <span style={{ color: "#fff" }}>{limits.packLimit}</span>
            </div>
          </div>

          {/* Account link — opens full /account page (credits, auto top-up,
              marketplace, etc.). Dropdown is summary-only; full management
              lives on the page. */}
          <a
            href="/account"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 12px",
              background: "none",
              border: "none",
              borderRadius: 8,
              color: "#fafafa",
              fontSize: 14,
              cursor: "pointer",
              textAlign: "left",
              textDecoration: "none",
              marginBottom: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span style={{ flex: 1 }}>Manage account</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>

          {/* Sign out */}
          <button
            onClick={async () => {
              await authClient.signOut();
              window.location.href = afterSignOutUrl || "/";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 12px",
              background: "none",
              border: "none",
              borderRadius: 8,
              color: "#ef4444",
              fontSize: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
