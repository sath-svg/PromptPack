import { SignUp } from "@/lib/auth-compat";

export default function SignUpPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <SignUp />
    </div>
  );
}
