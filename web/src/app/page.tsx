import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/constants";
import { HowItWorks } from "@/components/how-it-works";
import { HeroVideo } from "@/components/hero-video";
import { FeatureSlideshow } from "@/components/feature-slideshow";
import { DownloadButtons } from "@/components/download-buttons";
import { InstallAppButton } from "@/components/install-app-button";
import { NpxInstall } from "@/components/npx-install";
import { ExtraFeatures } from "@/components/extra-features";
import { FeatureRequestLink } from "@/components/feature-request-link";
import { RoadmapTooltip } from "@/components/roadmap-tooltip";
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
      "ratingCount": "10"
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
          style={{ marginTop: "clamp(3rem, 15vh, 6rem)", marginBottom: "1rem" }}
        />
        <h1 className="hero-subhead">
          Stop losing your best prompts.
        </h1>
        <p>
          ChatGPT alone sees 2.5 – 3 billion prompts a day.
          <br />
          The best prompts shouldn't disappear into chat history. Save your winners.
          <br />
          Turn them into repeatable workflows. Move faster with a library of your best prompts.
        </p>

        <NpxInstall />

        <DownloadButtons />

        <div className="hero-cta">
          <InstallAppButton />
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

        <HeroVideo />
      </div>

      <FeatureSlideshow />

      <div className="hero" style={{ marginTop: 0 }}>
        <h4 className="hero-hook">
          <a className="hero-hook-link" href="#faq">See FAQ</a>
        </h4>
      </div>

<HowItWorks />

      <section className="workflow-section">
        <div className="workflow-inner">
          <h2 className="workflow-hero-title">What is a <span className="gradient-text">PromptPack</span>?</h2>
          <p className="workflow-hero-subtitle">
            Save individual prompts, then organize them into a <span className="gradient-text">PromptPack</span> — a reusable workflow you can run in any LLM or agent.
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

              <div className="workflow-arrow">←</div>

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

              <div className="workflow-arrow">←</div>

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
              <h3 className="workflow-pack-title">Stock Analyzer <span className="gradient-text">PromptPack</span></h3>
              <p className="workflow-pack-description">
                13-point framework • Investment Analysis
              </p>
              <div className="workflow-pack-badge">
                <span className="gradient-text">.pmtpk</span>
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
            <Link className="pro-link" href="/pricing">Pro</Link> to create your own <span className="gradient-text">PromptPacks</span>
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
              Create your <span className="gradient-text">PromptPacks</span> in the dashboard after sign-in
            </p>
          </div>
        </div>
      </section>

      <ExtraFeatures />

      <p className="how-footnote" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
        Saving prompts for personal use? Free does the job. Building and sharing polished prompt packs? Go <Link className="pro-link" href="/pricing">Pro</Link>.
      </p>

      <section className="testimonials-section">
        <div className="testimonials-inner">
          <h2 className="upcoming-title">Loved by <span className="gradient-text">prompt engineers</span></h2>
          <p className="testimonials-subtitle">
            See what our users are saying on the <a href="https://chromewebstore.google.com/detail/promptpack-%E2%80%93-save-enhance/ajfgnekiofhiblifmiimnlmcnfhibnbl/reviews" target="_blank" rel="noopener noreferrer" className="testimonials-link">Chrome Web Store</a>
          </p>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;Writing quality prompt so much easier now. Really amazing idea.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar"><img src="/img/reviewers/bergen-bergwin.jpg" alt="Bergen Bergwin" /></div>
                <span className="testimonial-name">Bergen Bergwin</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;A huge help for my writing and coding tasks keeping all my best prompt organized.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar"><img src="/img/reviewers/mike-edwin.jpg" alt="Mike Edwin" /></div>
                <span className="testimonial-name">Mike Edwin</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;Amazing time saver.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar"><img src="/img/reviewers/robert-beckett.jpg" alt="Robert Beckett" /></div>
                <span className="testimonial-name">Robert Beckett</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;Saving and enhancing prompts for ChatGPT and Claude in one place has really boosted my efficiency.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar"><img src="/img/reviewers/blessing-mahmood.jpg" alt="Blessing Mahmood" /></div>
                <span className="testimonial-name">Blessing Mahmood</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;REALLY AMAZING&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar"><img src="/img/reviewers/kendra-brasfield.jpg" alt="Kendra Brasfield" /></div>
                <span className="testimonial-name">Kendra Brasfield</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;Simple but powerful tool that improve my workflow.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar"><img src="/img/reviewers/alfred-jacob.jpg" alt="Alfred Jacob" /></div>
                <span className="testimonial-name">Alfred Jacob</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mindmap-section">
        <div className="mindmap-inner">
          <h2 className="mindmap-header">What <span className="gradient-text">PromptPack</span> is built for</h2>

          <div className="mindmap-diagram">
            <div className="mindmap-row">
              <div className="mindmap-card">
                <div className="mindmap-icon">📁</div>
                <h4>Prompt Saver</h4>
                <p>Save, enhance, and organize your prompts in one place.</p>
              </div>

              <div className="mindmap-connector">
                <span className="mindmap-arrow">←</span>
              </div>

              <div className="mindmap-node">
                <span className="gradient-text">PromptPack</span>
              </div>

              <div className="mindmap-connector">
                <span className="mindmap-arrow">→</span>
              </div>

              <div className="mindmap-card">
                <div className="mindmap-icon">💎</div>
                <h4>Digital Asset</h4>
                <p>Export your encrypted <span className="gradient-text">PromptPack</span> and license them to monetize your work.</p>
              </div>
            </div>

            <div className="mindmap-arrow-down">↓</div>

            <div className="mindmap-row mindmap-row-bottom">
              <div className="mindmap-card mindmap-card-wide">
                <div className="mindmap-icon">🤖</div>
                <h4>Workflow Automater</h4>
                <p>Automate workflows with AI agents using modular <span className="gradient-text">PromptPacks</span>.</p>
                <span className="mindmap-new">NEW!</span>
              </div>
            </div>
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
                A <span className="gradient-text">PromptPack</span> is a curated set of prompts grouped into a reusable workflow — like a playlist. Save and enhance prompts in one click while you are chatting,
                then reuse the packs <span className="faq-highlight">seamlessly</span> across ChatGPT, Claude, and Gemini with no copy-paste or tab switching.
              </p>
            </div>
            <div className="faq-item">
              <h3>2) Why not just use Google Docs, or Notepad to store prompts?</h3>
              <p>
                Documents get messy fast: prompts get buried, duplicated, and scattered across files — often left exposed for others to see. <span className="gradient-text">PromptPack</span> organizes them into reusable, encryptable packs you can access <span className="faq-highlight">instantly</span>.
              </p>
            </div>
            <div className="faq-item">
              <h3>3) How does <span className="gradient-text">.pmtpk</span> and security help me share, distribute, or license <span className="gradient-text">PromptPacks</span> safely?</h3>
              <p>
                <span className="gradient-text">.pmtpk</span> is a dedicated format that does not open like a normal text file, so your prompts are not casually readable
                in Notepad, Word etc. With added encryption, these packs will stay accessible to you and only the people you share with, ideal for
                distributing and licensing your <span className="gradient-text">PromptPacks</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="roadmap-section">
        <div className="upcoming-cta">
          <p className="upcoming-cta-header">
            <span className="upcoming-cta-icon">🟣</span>
            <RoadmapTooltip />
          </p>
          <p className="upcoming-cta-footer">
            Have a feature in mind?{" "}
            <FeatureRequestLink />
          </p>
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
