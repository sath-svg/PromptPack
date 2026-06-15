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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <SignUp callbackURL={callback} initialEmail={email} />
    </div>
  );
}
