import Link from "next/link";

export const runtime = "edge";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Page Not Found</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/">
        <button className="btn btn-primary">Go Home</button>
      </Link>
    </div>
  );
}
