import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/constants";
import './globals.css';

export default function Home({ searchParams }: { searchParams: { beta?: string } }) {
  const betaStatus = searchParams?.beta;

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
          <a className="hero-hook-link" href="#faq">See FAQ</a>
        </h4>

        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem auto'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🚀 Looking for Beta Testers
          </h3>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--muted-foreground)',
            marginBottom: '1rem',
            lineHeight: '1.5'
          }}>
            Get early access to new features and discounted rates. Help shape the future of PromptPack!
          </p>
          {betaStatus === 'success' && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: '#22c55e',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}>
              ✓ Thanks for signing up! We'll be in touch soon.
            </div>
          )}
          {betaStatus === 'error' && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}>
              Something went wrong. Please try again.
            </div>
          )}
          <form
            action="/api/beta-signup"
            method="POST"
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
          >
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--foreground)',
                fontSize: '0.95rem'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '120px' }}
            >
              Join Beta
            </button>
          </form>
        </div>

        <div className="hero-cta">
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="btn btn-primary">Dashboard</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <button className="btn btn-primary">Go to Dashboard</button>
            </Link>
          </SignedIn>
          <Link href="/pricing">
            <button className="btn btn-secondary">See Plans</button>
          </Link>
        </div>
      </div>

      <section className="workflow-section">
        <div className="workflow-inner">
          <h2 className="workflow-hero-title">What is a PromptPack?</h2>
          <p className="workflow-hero-subtitle">
            Save individual prompts, then organize them into a PromptPack — a reusable workflow you can run in any LLM or agent.
          </p>

          <div className="workflow-demo">
            <div className="workflow-prompts">
              <div className="workflow-prompt-card">
                <div className="workflow-prompt-header">
                  <span className="workflow-prompt-number">1</span>
                  <span className="workflow-prompt-title">Executive Summary</span>
                </div>
                <p className="workflow-prompt-preview">
                  Analyze [████████] using ████████████. Use only verifiable, factual information. Be concise, analytical...
                </p>
              </div>

              <div className="workflow-arrow">→</div>

              <div className="workflow-prompt-card">
                <div className="workflow-prompt-header">
                  <span className="workflow-prompt-number">2</span>
                  <span className="workflow-prompt-title">Revenue Model</span>
                </div>
                <p className="workflow-prompt-preview">
                  Explain the revenue model and ████████. Clarify whether revenues are ████████, recurring...
                </p>
              </div>

              <div className="workflow-arrow">→</div>

              <div className="workflow-prompt-card">
                <div className="workflow-prompt-header">
                  <span className="workflow-prompt-number">3</span>
                  <span className="workflow-prompt-title">Competitive Edge</span>
                </div>
                <p className="workflow-prompt-preview">
                  Identify what protects the company's ████████ from competition, such as brand, ████████...
                </p>
              </div>

              <div className="workflow-arrow">→</div>

              <div className="workflow-prompt-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.05)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--primary)' }}>+9</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>more prompts</div>
                </div>
              </div>
            </div>

            <div className="workflow-arrow-down">↓</div>

            <div className="workflow-pack">
              <div className="workflow-pack-icon">📦</div>
              <h3 className="workflow-pack-title">Stock Analyzer PromptPack</h3>
              <p className="workflow-pack-description">
                13-point framework • Investment Analysis
              </p>
              <div className="workflow-pack-badge">
                <span className="gradient-text">.pmtpk</span>
              </div>
            </div>

            <details className="workflow-future">
              <summary className="workflow-future-title">
                <div>
                  <div className="workflow-future-main">The Vision</div>
                  <div className="workflow-future-badge">Coming Soon</div>
                </div>
              </summary>
              <p className="workflow-future-text">
                LLMs will be able to run PromptPacks — multi-step workflows — with a single command.
                <br />
                <span className="workflow-future-example">
                  "Run Stock Analyzer PromptPack for NVDA"
                </span>
                <br />
                One command. Same workflow. Zero copy-paste.
              </p>
            </details>
          </div>
        </div>
      </section>

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
              data-tooltip="You can also use Alt+Shift+S (Option+Shift+S on Mac) while in the prompt box to save it to the extension."
              aria-label="You can also use Alt+Shift+S (Option+Shift+S on Mac) while in the prompt box to save it to the extension."
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
                  <video src={assetUrl("/img/chatgpt.webm")} autoPlay loop muted playsInline />
                </div>
                <p className="demo-caption">ChatGPT</p>
              </div>
            </div>
            <div className="llm-panel" id="llm-panel-claude" role="tabpanel" data-panel="claude">
              <div className="demo-card demo-card-wide">
                <div className="demo-media" aria-label="Claude save flow">
                  <video src={assetUrl("/img/claude.webm")} autoPlay loop muted playsInline />
                </div>
                <p className="demo-caption">Claude</p>
              </div>
            </div>
            <div className="llm-panel" id="llm-panel-gemini" role="tabpanel" data-panel="gemini">
              <div className="demo-card demo-card-wide">
                <div className="demo-media" aria-label="Gemini save flow">
                  <video src={assetUrl("/img/gemini.webm")} autoPlay loop muted playsInline />
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

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <SignedOut>
              <Link href="/pricing">
                <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
                  Purchase Pro Plan
                </button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/pricing">
                <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
                  Purchase Pro Plan
                </button>
              </Link>
            </SignedIn>
            <p style={{ marginTop: '1rem', color: 'var(--muted-foreground)', fontSize: '0.90rem' }}>
              Create your PromptPacks in the dashboard after sign-in
            </p>
          </div>
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
                Documents get messy fast: prompts get buried, duplicated, and scattered across files — often left exposed for others to see. <span className="gradient-text">PromptPack</span> organizes them into reusable, encryptable packs you can access <span className="faq-highlight">instantly</span>.
              </p>
            </div>
            <div className="faq-item">
              <h3>3) How does <span className="gradient-text">.pmtpk</span> and security help me share, distribute, or license PromptPacks safely?</h3>
              <p>
                <span className="gradient-text">.pmtpk</span> is a dedicated format that does not open like a normal text file, so your prompts are not casually readable
                in Notepad, Word etc. With added encryption, these packs will stay accessible to you and only the people you share with, ideal for
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
