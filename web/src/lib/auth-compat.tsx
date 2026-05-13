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

export function UserButton({
  afterSignOutUrl,
  appearance,
}: {
  afterSignOutUrl?: string;
  appearance?: any;
}) {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = (user.name || user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ position: "relative" }}>
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
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            padding: 8,
            minWidth: 180,
            zIndex: 100,
          }}
        >
          <div style={{ padding: "8px 12px", fontSize: 14, color: "#999", borderBottom: "1px solid #333" }}>
            {user.email}
          </div>
          <button
            onClick={async () => {
              await authClient.signOut();
              window.location.href = afterSignOutUrl || "/";
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
