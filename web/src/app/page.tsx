import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import './globals.css';

export default function Home() {
  return (
    <>
      <div className="hero">
        <Image
          src="/img/promptpack_logo_horizontal.png"
          alt="PromptPack"
          width={720}
          height={165}
          priority
          className="hero-logo"
          style={{ marginTop: "10rem", marginBottom: "2.5rem" }}
        />
        <h1 className="hero-subhead">
          Stop losing your best prompts.
        </h1>
        <p>
          Build your own <span className="gradient-text">PromptPacks</span> for ChatGPT, Claude, and Gemini - organized like playlists.
          <br />
          Save your prompts. Reuse workflows. Work faster.
        </p>

        <h4 className="hero-hook">Make your Prompts Sing!</h4>

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

<section className="how-section">
  <div className="how-inner">
    <h2 className="how-title">How it works</h2>
    <p className="how-subtitle">
      From a “good prompt” to reusable workflow — in under a minute.
    </p>

    <div className="how-steps">
      <div className="how-step">
        <h3>1) Download the Chrome extension</h3>
        <p>
          Install PromptPack once, and you’re ready to save prompts wherever you work.
          <span className="pro-break" aria-hidden="true"></span>
          Your saves live in the extension and give you an option to export them with encryption
          as <span className="gradient-text">PromptPacks</span> (.pmtpk)
        </p>
      </div>

      <div className="how-step">
        <h3>2) Hit <span className="gradient-text">Save</span> while you’re prompting</h3>
        <p>
          A Save button appears inside the prompt box in ChatGPT, Claude, and Gemini.
          Click it to capture the prompt instantly.{" "}
          <span className="tooltip-wrap">
            <span
              className="tooltip-trigger"
              data-tooltip="You can also use Ctrl+Alt+S (Cmd+Opt+S on Mac) while in the prompt box to save it to the extension."
              aria-label="You can also use Ctrl+Alt+S (Cmd+Opt+S on Mac) while in the prompt box to save it to the extension."
              tabIndex={0}
            >
              ℹ️
            </span>
          </span>
        </p>
      </div>

      <div className="how-step">
        <h3>3) Log in to sync to your dashboard</h3>
        <p>
          Signing in gives you access to save <span className="gradient-text">PromptPacks</span> to your dashboard
          so that you can access them anywhere and stay organized.
        </p>
      </div>

      <div className="how-step">
        <h3>4) Go <Link className="pro-link" href="/pricing">Pro</Link> to create and share PromptPacks</h3>
        <p>
          Pro unlocks the ability to build your own <span className="gradient-text">PromptPacks</span> from the dashboard.
        </p>
      </div>
    </div>

    <p className="how-footnote">
      Prefer to just save and reuse? Free gets the job done. Pro is for building, packaging, and sharing.
    </p>
  </div>
</section>

      <section className="demo-section">
        <div className="demo-grid">
          <div className="demo-card">
            <div className="demo-media" aria-label="ChatGPT save flow">
              <img src="/img/chatgpt-recording.gif" alt="ChatGPT save flow" loading="lazy" />
            </div>
            <p className="demo-caption">ChatGPT save flow</p>
          </div>
          <div className="demo-card">
            <div className="demo-media" aria-label="Claude save flow">
              <img src="/img/claude-recording.gif" alt="Claude save flow" loading="lazy" />
            </div>
            <p className="demo-caption">Claude save flow</p>
          </div>
          <div className="demo-card">
            <div className="demo-media" aria-label="Gemini save flow">
              <img src="/img/gemini-recording.gif" alt="Gemini save flow" loading="lazy" />
            </div>
            <p className="demo-caption">Gemini save flow</p>
          </div>
          <div className="demo-card">
            <div className="demo-media" aria-label="Dashboard walkthrough">
              <img src="/img/dashboard.gif" alt="Dashboard walkthrough" loading="lazy" />
            </div>
            <p className="demo-caption">Dashboard walkthrough</p>
          </div>
        </div>
      </section>

      <section className="pro-section">
        <div className="pro-inner">
          <h2 className="pro-title">Turn your best prompts into products.</h2>
          <p className="pro-copy">
            Your best ideas shouldn&rsquo;t live in a chat history. With{" "}
            <Link className="pro-link" href="/pricing">Pro</Link>, you can create your own PromptPacks
            and export them as <span className="gradient-text">.pmtpk</span> — a purpose-built format for sharing and distribution.
            <br />
            <span className="pro-break" aria-hidden="true"></span>
            Add optional encryption so that your packs are secure, then distribute with
            confidence and license your work like a real digital asset.
          </p>
          <p className="pro-tagline">Pack your ideas. Monetize your prompts.</p>
        </div>
      </section>
    </>
  );
}
