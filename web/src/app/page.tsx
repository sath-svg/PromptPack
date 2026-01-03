import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/constants";
import './globals.css';

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PromptPack",
    "applicationCategory": "BrowserApplication",
    "operatingSystem": "Chrome",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    },
    "description": "Save and organize your best AI prompts from ChatGPT, Claude, and Gemini. Build reusable prompt libraries, create PromptPacks, and discover community prompts.",
    "url": "https://pmtpk.com",
    "image": "https://pmtpk.com/img/promptpack_logo_horizontal.png",
    "publisher": {
      "@type": "Organization",
      "name": "PromptPack"
    },
    "featureList": [
      "Save prompts from ChatGPT, Claude, and Gemini",
      "Organize prompts into reusable packs",
      "Chrome extension for quick access",
      "Share prompts with community",
      "Export and encrypt prompt packs"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="hero">
        <Image
          src={assetUrl("/img/promptpack_logo_horizontal.png")}
          alt="PromptPack"
          width={720}
          height={165}
          priority
          className="hero-logo"
          style={{ marginTop: "clamp(3rem, 15vh, 10rem)", marginBottom: "2.5rem" }}
        />
        <h1 className="hero-subhead">
          Stop losing your best prompts.
        </h1>
        <p>
          ChatGPT alone sees 2.5 – 3 billion prompts a day.
          <br />
          The best ones shouldn’t disappear into chat history. Save your winners.
          <br />
          Turn them into repeatable workflows. Move faster with a library of your best prompts.
        </p>
        <h4 className="hero-hook">
          <a className="hero-hook-link" href="#faq">What is a PromptPack?</a>
        </h4>

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
    <h2 className="how-title demo-title">How it works.</h2>
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
        <h2 className="how-title demo-title">Works flawlessly with ChatGPT, Gemini and Claude.</h2>
        <div className="llm-tabs" role="tablist" aria-label="LLM demos">
          <input
            className="llm-tab-input"
            type="radio"
            name="llm-demo"
            id="llm-chatgpt"
            defaultChecked
          />
          <label className="llm-tab" htmlFor="llm-chatgpt" role="tab" aria-controls="llm-panel-chatgpt">
            ChatGPT
          </label>
          <input
            className="llm-tab-input"
            type="radio"
            name="llm-demo"
            id="llm-claude"
          />
          <label className="llm-tab" htmlFor="llm-claude" role="tab" aria-controls="llm-panel-claude">
            Claude
          </label>
          <input
            className="llm-tab-input"
            type="radio"
            name="llm-demo"
            id="llm-gemini"
          />
          <label className="llm-tab" htmlFor="llm-gemini" role="tab" aria-controls="llm-panel-gemini">
            Gemini
          </label>
          <div className="llm-panels">
            <div className="llm-panel" id="llm-panel-chatgpt" role="tabpanel" data-panel="chatgpt">
              <div className="demo-card demo-card-wide">
                <div className="demo-media" aria-label="ChatGPT save flow">
                  <img src={assetUrl("/img/chatgpt-recording.gif")} alt="ChatGPT save flow" loading="lazy" />
                </div>
                <p className="demo-caption">ChatGPT</p>
              </div>
            </div>
            <div className="llm-panel" id="llm-panel-claude" role="tabpanel" data-panel="claude">
              <div className="demo-card demo-card-wide">
                <div className="demo-media" aria-label="Claude save flow">
                  <img src={assetUrl("/img/claude-recording.gif")} alt="Claude save flow" loading="lazy" />
                </div>
                <p className="demo-caption">Claude</p>
              </div>
            </div>
            <div className="llm-panel" id="llm-panel-gemini" role="tabpanel" data-panel="gemini">
              <div className="demo-card demo-card-wide">
                <div className="demo-media" aria-label="Gemini save flow">
                  <img src={assetUrl("/img/gemini-recording.gif")} alt="Gemini save flow" loading="lazy" />
                </div>
                <p className="demo-caption">Gemini</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pro-section">
        <div className="pro-inner">
          <h2 className="pro-title"><Link className="pro-link" href="/pricing">Pro</Link> is for creators.</h2>
          <p className="pro-copy">
            Your best ideas shouldn&rsquo;t live in a chat history. Unlock {" "}
            <Link className="pro-link" href="/pricing">Pro</Link> to create your own PromptPacks
            and export them as <span className="gradient-text">.pmtpk</span> — a purpose-built format for sharing and distribution.
            <br />
            <span className="pro-break" aria-hidden="true"></span>
            Add encryption so that your packs are secure, then distribute with
            confidence and license your work like a real digital asset.
          </p>
          <p className="pro-tagline">Pack your ideas. Monetize your prompts.</p>
        </div>
      </section>

      <section className="demo-section dashboard-section">
        <div className="demo-card demo-card-wide">
          <div className="demo-media demo-media-wide" aria-label="Dashboard walkthrough">
            <img src={assetUrl("/img/dashboard.gif")} alt="Dashboard walkthrough" loading="lazy" />
          </div>
          <p className="demo-caption">Save your prompts to dashboard and create your own PromptPacks.</p>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-inner">
          <h2 className="faq-title">FAQ</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>1) What is a <span className="gradient-text">PromptPack</span>, and how is it different from a folder of saved prompts?</h3>
              <p>
                A <span className="gradient-text">PromptPack</span> is a curated set of prompts grouped into a reusable workflow — like a playlist. Save in one click while you are chatting,
                then reuse the packs <span className="faq-highlight">seamlessly</span> across ChatGPT, Claude, and Gemini with no dragging to copy and paste or tab switching.
              </p>
            </div>
            <div className="faq-item">
              <h3>2) Why not just use Google Docs, or Notepad to store prompts?</h3>
              <p>
                Documents get messy fast: prompts get buried, duplicated, and scattered across files. <span className="gradient-text">PromptPack</span> keeps everything organized into reusable packs you can access <span className="faq-highlight">instantly</span>.
                <br/>
                <span className="pro-break" aria-hidden="true"></span>
                What’s next: Beyond storage, <span className="gradient-text">PromptPacks</span> will evolve into agent-ready workflows — drag-and-drop modules you can plug into an LLM to get various forms of work done, while keeping your data sandboxed to that agent.
              </p>
            </div>
            <div className="faq-item">
              <h3>3) How does <span className="gradient-text">.pmtpk</span> and security help me share, distribute, or license PromptPacks safely?</h3>
              <p>
                <span className="gradient-text">.pmtpk</span> is a dedicated format that does not open like a normal text file, so your prompts are not casually readable
                in Notepad,etc. With optional encryption, these packs stay accessible to you and only the people you share with, ideal for
                distributing and licensing your <span className="gradient-text">PromptPacks</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-links">
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
        </div>
        <p className="footer-note">
          Powered by pmtpk.ai
        </p>
      </footer>
    </>
  );
}
