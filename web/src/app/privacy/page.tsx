import type { Metadata } from "next";
import Link from "next/link";
import { SkillsetShell } from "@/components/skillset-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Skillset",
  description:
    "How Skillset collects, uses, stores, and protects your data across the Chrome extension, web app, and desktop app. GDPR & CCPA rights, BYOK details, and third-party processors.",
  alternates: { canonical: "https://skillset.so/privacy" },
  openGraph: {
    title: "Privacy Policy — Skillset",
    description: "How Skillset handles your prompts, account data, and BYOK keys.",
    url: "https://skillset.so/privacy",
  },
};

export default function PrivacyPolicy() {
  return (
    <SkillsetShell showHalo>
      <section className="mx-auto max-w-[820px] px-6 py-20 md:py-24">
        <div
          className={[
            "rounded-3xl border border-white/[0.06] bg-[#0f0f12] p-8 md:p-14",
            "[&_h1]:text-[40px] [&_h1]:md:text-[52px] [&_h1]:font-medium [&_h1]:tracking-[-0.02em] [&_h1]:text-zinc-50 [&_h1]:leading-[1.05] [&_h1]:mb-1",
            "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-[24px] [&_h2]:font-medium [&_h2]:text-zinc-50 [&_h2]:tracking-[-0.015em] [&_h2]:border-b [&_h2]:border-white/[0.06] [&_h2]:pb-3",
            "[&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-[17px] [&_h3]:font-medium [&_h3]:text-zinc-100",
            "[&_p]:text-[15px] [&_p]:leading-[1.7] [&_p]:text-zinc-400 [&_p]:mb-3",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-2",
            "[&_li]:text-[15px] [&_li]:leading-[1.6] [&_li]:text-zinc-400 [&_li]:marker:text-zinc-700",
            "[&_strong]:text-zinc-100 [&_strong]:font-medium",
            "[&_a]:text-[#7BA7FF] [&_a]:hover:text-[#2563EB] [&_a]:underline [&_a]:decoration-[#7BA7FF]/30 [&_a]:underline-offset-4",
            "[&_section]:mb-10",
          ].join(" ")}
        >
          <h1>Privacy Policy</h1>
          <p
            className="!mb-10 !mt-2 text-[12px] uppercase tracking-[0.18em] !text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Last Updated · May 11, 2026
          </p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to Skillset. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our browser extensions (Chrome / Firefox / Safari), web application, and desktop app.
            </p>
            <p>
              By using Skillset, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> When you create an account, we collect your email address, name, and profile picture through our authentication provider (BetterAuth; legacy Clerk accounts during migration).</li>
              <li><strong>Prompts &amp; Packs:</strong> The AI prompts and prompt packs you save are stored either locally on your device (Free tier) or in our cloud database (Pro / Studio tiers).</li>
              <li><strong>Skill Preset Reference Images:</strong> When you use Skill Preset to extract an art style, the images you upload are sent to our Vision LLM provider (Claude via OpenRouter) for analysis. They are stored alongside the resulting skillset only if you choose to upload to cloud; otherwise they stay local.</li>
              <li><strong>Generated Previews:</strong> AI-generated preview images (from DALL-E 3 via OpenAI, or Gemini Flash Image via OpenRouter) are returned to your client. They are persisted in cloud only if you save the skillset to cloud.</li>
              <li><strong>Payment Information:</strong> When you upgrade to Pro / Studio or purchase credit top-ups, payment information is processed by Stripe. We do not store your full credit card details.</li>
              <li><strong>BYOK API Keys:</strong> If you bring your own API keys (Anthropic, OpenAI, Gemini, Grok, DeepSeek, Perplexity, Kimi, OpenRouter), they are stored locally on your device only. They are NEVER sent to Skillset servers — direct provider calls happen from your client.</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <ul>
              <li><strong>Usage Data:</strong> We collect information about how you interact with our services, including the features you use and actions you take. We use Plausible (cookieless, EU-hosted) for landing-page traffic and PostHog (US-hosted, identified-only profiles) for product analytics inside the logged-in web app and desktop app. PostHog can be disabled from Settings &gt; Privacy in the desktop app.</li>
              <li><strong>Credit Ledger:</strong> For managed-mode users, we record each reserved / settled / refunded credit transaction with model id, input/output token counts, and the actual OpenRouter cost. This is shown to you in Settings &gt; Credits.</li>
              <li><strong>Device Information:</strong> We may collect information about your device, including browser type, operating system, and extension / app version.</li>
              <li><strong>Extension Activity:</strong> We track which LLM platforms (ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Kimi) you save prompts from to improve our service.</li>
            </ul>

            <h3>2.3 Information We Do NOT Collect</h3>
            <ul>
              <li>We do NOT collect or read the content of your conversations with AI chatbots.</li>
              <li>We do NOT track your browsing history outside of supported LLM platforms.</li>
              <li>We do NOT sell your data to third parties.</li>
              <li>We do NOT display advertisements based on your prompt content.</li>
              <li>We do NOT train any model on your prompts, packs, skillsets, or generated images.</li>
              <li>We do NOT access files in your connected workspace folder unless you explicitly run an agent action; even then, file edits are diff-reviewed before being applied.</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve our browser extensions, web app, and desktop app.</li>
              <li><strong>Cloud Sync:</strong> To sync your saved prompts, packs, and skillsets across devices (Pro / Studio tiers).</li>
              <li><strong>Authentication:</strong> To verify your identity and manage your account.</li>
              <li><strong>Routing &amp; Metering:</strong> In managed mode, to route your request to the appropriate model tier (Fast / Balanced / Powerful) and to meter usage against your credit balance.</li>
              <li><strong>Style Analysis (Skill Preset):</strong> To send your uploaded reference images to a Vision LLM (Claude Haiku 4.5 via OpenRouter) for art-style extraction.</li>
              <li><strong>Image Generation:</strong> To send your style-locked prompts to DALL-E 3 (OpenAI) or Gemini Flash Image (OpenRouter) for preview generation.</li>
              <li><strong>Payment Processing:</strong> To process subscription payments and credit top-ups (Stripe).</li>
              <li><strong>Customer Support:</strong> To respond to your inquiries and provide technical support.</li>
              <li><strong>Service Improvements:</strong> To analyze usage patterns and improve our features (aggregated, not tied to your prompts).</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues and fraudulent activity.</li>
              <li><strong>Communications:</strong> To send you service-related announcements and updates (you can opt-out of marketing emails).</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Storage and Security</h2>

            <h3>4.1 Where Your Data is Stored</h3>
            <ul>
              <li><strong>Free Tier:</strong> Prompts and packs are stored locally in your browser using Chrome&apos;s storage API or in a local SQLite database in the desktop app. This data never leaves your device unless you manually export it or sync to cloud.</li>
              <li><strong>Pro / Studio Tiers:</strong> Pack and skillset files are stored as encrypted blobs in Cloudflare R2 (object storage); metadata is stored in Convex (serverless database). Your data is stored in secure, geographically distributed data centers.</li>
              <li><strong>BYOK API Keys:</strong> Stored locally only (browser local storage / desktop app config). Never transmitted to Skillset.</li>
              <li><strong>Workspace Files:</strong> When you connect a workspace folder in the desktop app, Skillset writes <code>SKILLSET.md</code>, <code>Skillset-Flow.md</code>, and <code>.skillset/workflows/&lt;pack&gt;.md</code> as Skill Flow artifacts. All such files are removed when you disconnect the workspace.</li>
            </ul>

            <h3>4.2 Security Measures</h3>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul>
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers uses HTTPS / TLS encryption.</li>
              <li><strong>Encryption at Rest:</strong> Your prompt packs and skillsets can be password-protected with AES-256-GCM encryption (PBKDF2, 100,000 iterations). The <code>.skill</code> file format supports both obfuscated and password-encrypted modes.</li>
              <li><strong>Access Control:</strong> Your data is only accessible to you and authorized personnel for support purposes.</li>
              <li><strong>Secure Authentication:</strong> BetterAuth (replacing legacy Clerk) provides industry-standard OAuth 2.0 + JWT (RS256) flows.</li>
              <li><strong>Internal Worker Auth:</strong> Skillset&apos;s Cloudflare Workers proxy uses a server-side internal key to communicate with Convex; this key is never exposed to clients.</li>
              <li><strong>Regular Updates:</strong> We regularly update our security practices and monitor for vulnerabilities.</li>
            </ul>

            <h3>4.3 Data Retention</h3>
            <ul>
              <li><strong>Active Accounts:</strong> We retain your data for as long as your account is active.</li>
              <li><strong>Deleted Accounts:</strong> When you delete your account, we remove your personal data within 30 days.</li>
              <li><strong>Pro / Studio Cancellation:</strong> After cancellation, paid users have a grace period to export their data before custom packs / skillsets are deleted.</li>
              <li><strong>Credit Ledger:</strong> Transaction history is retained for billing reconciliation and tax purposes (typically 7 years).</li>
              <li><strong>Legal Requirements:</strong> We may retain certain data if required by law or for legitimate business purposes.</li>
            </ul>
          </section>

          <section>
            <h2>5. Third-Party Services</h2>
            <p>We use the following third-party services to provide our application:</p>

            <h3>5.1 BetterAuth (Authentication)</h3>
            <ul>
              <li><strong>Purpose:</strong> User authentication and account management.</li>
              <li><strong>Data Shared:</strong> Email address, name, profile picture.</li>
              <li><strong>Legacy:</strong> Existing Clerk accounts during migration period.</li>
            </ul>

            <h3>5.2 Stripe (Payment Processing)</h3>
            <ul>
              <li><strong>Purpose:</strong> Process subscription payments and credit top-up purchases.</li>
              <li><strong>Data Shared:</strong> Payment information, billing address, email.</li>
              <li><strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a></li>
            </ul>

            <h3>5.3 Convex (Database)</h3>
            <ul>
              <li><strong>Purpose:</strong> Store user data, pack metadata, skillset metadata, credit ledger.</li>
              <li><strong>Data Shared:</strong> User account information, pack / skillset metadata, credit transactions.</li>
              <li><strong>Privacy Policy:</strong> <a href="https://www.convex.dev/privacy" target="_blank" rel="noopener noreferrer">https://www.convex.dev/privacy</a></li>
            </ul>

            <h3>5.4 Cloudflare (Infrastructure)</h3>
            <ul>
              <li><strong>Purpose:</strong> Cloud storage (R2), API hosting (Workers), CDN.</li>
              <li><strong>Data Shared:</strong> Encrypted pack / skillset files, API requests.</li>
              <li><strong>Privacy Policy:</strong> <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com/privacypolicy/</a></li>
            </ul>

            <h3>5.5 OpenRouter (LLM Routing — Managed Mode)</h3>
            <ul>
              <li><strong>Purpose:</strong> Route managed-mode prompts to Claude, GPT-5, Gemini, Grok, DeepSeek, Llama, and other models. Used for Skill Flow orchestration, Skill Preset style analysis, and image generation fallback.</li>
              <li><strong>Data Shared:</strong> The prompt text and any attached images for the call you initiate. OpenRouter forwards to the underlying provider.</li>
              <li><strong>Privacy Policy:</strong> <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer">https://openrouter.ai/privacy</a></li>
            </ul>

            <h3>5.6 OpenAI (DALL-E 3 — Skill Preset Image Generation)</h3>
            <ul>
              <li><strong>Purpose:</strong> Generate preview images from style-locked prompts in Skill Preset.</li>
              <li><strong>Data Shared:</strong> The generation prompt only. Reference images are sent to OpenRouter (5.5), not to OpenAI directly.</li>
              <li><strong>Privacy Policy:</strong> <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">https://openai.com/policies/privacy-policy</a></li>
            </ul>

            <h3>5.7 Groq (Header Classification)</h3>
            <ul>
              <li><strong>Purpose:</strong> Generate short headers for prompts (Llama 3.1 8B Instant).</li>
              <li><strong>Data Shared:</strong> Prompt snippet (first 500 chars).</li>
              <li><strong>Privacy Policy:</strong> <a href="https://groq.com/privacy-policy" target="_blank" rel="noopener noreferrer">https://groq.com/privacy-policy</a></li>
            </ul>

            <p>
              These third-party services have their own privacy policies governing the use of your information. We encourage you to review their privacy policies. <strong>BYOK mode bypasses Skillset entirely</strong> — your requests go directly from your client to the provider you choose.
            </p>
          </section>

          <section>
            <h2>6. Browser Extension Permissions</h2>
            <p>Our extension (Chrome / Firefox / Safari) requests the following permissions:</p>
            <ul>
              <li><strong>storage:</strong> To save your prompts locally on your device.</li>
              <li><strong>unlimitedStorage:</strong> To allow Pro / Studio users to save more prompts without quota limitations.</li>
              <li><strong>tabs:</strong> To detect which LLM platform you&apos;re currently using.</li>
              <li><strong>identity:</strong> To authenticate your account with our web application.</li>
            </ul>
            <p>
              We only access websites you explicitly use the extension on: ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Kimi, and our web app at skillset.so. We do not track your browsing activity on other websites.
            </p>
          </section>

          <section>
            <h2>7. Desktop App File Access</h2>
            <p>The Skillset desktop app uses Tauri&apos;s capability-scoped file system access:</p>
            <ul>
              <li><strong>Workspace Folder:</strong> When you connect a workspace, the app gets read / write access to files within that folder (and nothing outside it).</li>
              <li><strong>Workflow Artifacts:</strong> The app writes <code>SKILLSET.md</code>, <code>Skillset-Flow.md</code>, and <code>.skillset/workflows/</code> into the workspace to give in-workspace agents (Claude Code, Cursor, etc.) a stable skill spec. All such artifacts are deleted when you disconnect.</li>
              <li><strong>Agent Edits:</strong> Every file edit proposed by the agent is staged and shown to you as a diff. Nothing applies until you accept.</li>
              <li><strong>Attachments:</strong> Files you attach to a chat are copied into <code>.skillset-attachments/</code> in the workspace.</li>
            </ul>
          </section>

          <section>
            <h2>8. Your Privacy Rights</h2>
            <p>You have the following rights regarding your personal data:</p>

            <h3>8.1 Access and Portability</h3>
            <ul>
              <li><strong>View Your Data:</strong> You can view all your saved prompts, packs, and skillsets in the extension, desktop app, or web dashboard.</li>
              <li><strong>Export Your Data:</strong> You can export prompts/packs as <code>.skill</code> files (optionally password-encrypted) at any time.</li>
              <li><strong>Data Format:</strong> Exported files are in a portable format that can be re-imported into Skillset, or read by any tool that supports the <code>.skill</code> spec.</li>
            </ul>

            <h3>8.2 Modification and Deletion</h3>
            <ul>
              <li><strong>Edit Prompts:</strong> You can modify or delete individual prompts, packs, and skillsets at any time.</li>
              <li><strong>Delete Account:</strong> You can delete your account by contacting support using the support button at the bottom right of the screen.</li>
              <li><strong>Revoke Access:</strong> You can uninstall the extension or desktop app to stop data collection.</li>
            </ul>

            <h3>8.3 Opt-Out Rights</h3>
            <ul>
              <li><strong>Marketing Emails:</strong> You can opt-out of promotional emails by clicking the unsubscribe link.</li>
              <li><strong>Cloud Sync:</strong> Free tier users&apos; data stays local; Pro / Studio users can downgrade or use BYOK mode to stop cloud sync.</li>
              <li><strong>Managed Mode:</strong> Toggle managed mode off in Settings to route all calls through your own BYOK keys — Skillset servers never see the prompt content.</li>
            </ul>

            <h3>8.4 Residents of the EU / EEA (GDPR Rights)</h3>
            <p>If you are located in the European Union or European Economic Area, you have additional rights under GDPR:</p>
            <ul>
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
            </ul>

            <h3>8.5 California Residents (CCPA Rights)</h3>
            <p>If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA):</p>
            <ul>
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to say no to the sale of personal information (we do not sell your data)</li>
              <li>Right to access your personal information</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising your rights</li>
            </ul>

            <p>
              To exercise any of these rights, please contact us using the support button at the bottom right of the screen.
            </p>
          </section>

          <section>
            <h2>9. Children&apos;s Privacy</h2>
            <p>
              Skillset is not intended for use by children under the age of 13 (or 16 in the EU). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately using the support button at the bottom right of the screen, and we will delete the information.
            </p>
          </section>

          <section>
            <h2>10. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure that adequate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
            <p>
              Our services use cloud infrastructure that may process data in multiple regions including the United States and Europe. Third-party LLM providers (OpenAI, Anthropic via OpenRouter, Google Gemini, etc.) may process your prompts in their own regions. By using our services, you consent to these transfers.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. When we make changes:
            </p>
            <ul>
              <li>We will update the &quot;Last Updated&quot; date at the top of this page.</li>
              <li>For material changes, we will notify you via email or in-app.</li>
              <li>Your continued use of Skillset after changes constitutes acceptance of the updated policy.</li>
            </ul>
            <p>
              We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li><strong>Support:</strong> Click the support button at the bottom right of the screen.</li>
              <li><strong>Website:</strong> <a href="https://skillset.so" target="_blank" rel="noopener noreferrer">https://skillset.so</a></li>
              <li><strong>Response Time:</strong> We aim to respond to all inquiries within 48 hours.</li>
            </ul>
          </section>

          <section>
            <h2>13. Data Security Incident Response</h2>
            <p>
              In the unlikely event of a data breach that affects your personal information, we will:
            </p>
            <ul>
              <li>Notify you within 72 hours of discovering the breach.</li>
              <li>Provide details about what information was compromised.</li>
              <li>Explain the steps we&apos;re taking to address the breach.</li>
              <li>Offer guidance on how you can protect yourself.</li>
              <li>Comply with all applicable data breach notification laws.</li>
            </ul>
          </section>

          <section className="!mb-0 rounded-2xl border-l-4 border-[#2563EB] bg-[#2563EB]/10 p-6">
            <h2 className="!mt-0 !border-b-0 !pb-0 !text-[20px]">Summary</h2>
            <p className="!text-zinc-100">
              <strong>In simple terms:</strong> Skillset collects only what&apos;s needed to run the service. Free-tier data stays on your device. Paid-tier data is encrypted in our cloud. BYOK mode keeps your requests off our servers entirely. We don&apos;t sell your data, don&apos;t train models on it, and don&apos;t read your AI conversations. You can export or delete everything at any time.
            </p>
          </section>

          <div className="mt-12 border-t border-white/[0.06] pt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2 text-[14px] text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05]"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </SkillsetShell>
  );
}
