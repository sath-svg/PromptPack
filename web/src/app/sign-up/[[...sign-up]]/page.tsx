import { SignUp } from "@/lib/auth-compat";

// Next 15: searchParams is async — must await before reading.
// Supports `?callback=/path` for redirects originating from CTAs that
// want to send the user somewhere specific post-auth, and `?email=` to
// prefill the email field (used by the homepage trial gate).
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callback?: string; email?: string }>;
}) {
  const params = await searchParams;
  const callback = typeof params.callback === "string" ? params.callback : undefined;
  const email = typeof params.email === "string" ? params.email : undefined;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <a
        href="/"
        aria-label="Back to home"
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginLeft: 24,
          marginBottom: 4,
          color: "#a1a1aa",
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>&larr;</span>
        Back
      </a>
      <SignUp callbackURL={callback} initialEmail={email} />
    </div>
  );
}
