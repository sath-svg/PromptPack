import { SignIn } from "@/lib/auth-compat";

export default function SignInPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <SignIn />
    </div>
  );
}
