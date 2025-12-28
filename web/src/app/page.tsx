import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export const runtime = "edge";

export default function Home() {
  return (
    <div className="hero">
      <h1>Save Your Best AI Prompts</h1>
      <p>
        Capture prompts from ChatGPT, Claude, and Gemini. Organize them into
        packs and discover prompts from the community.
      </p>

      <div className="hero-cta">
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="btn btn-primary">Get Started Free</button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <button className="btn btn-primary">Go to Dashboard</button>
          </Link>
        </SignedIn>
        <Link href="/marketplace">
          <button className="btn btn-secondary">Browse Marketplace</button>
        </Link>
      </div>
    </div>
  );
}
