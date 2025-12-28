import { SignUp } from "@clerk/nextjs";

export const runtime = "edge";

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
