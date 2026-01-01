import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - PromptPack",
  description: "Privacy policy for PromptPack - Learn how we collect, use, and protect your data",
};

export default function PrivacyPolicy() {
  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: January 1, 2025</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to PromptPack ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Chrome extension and web application.
          </p>
          <p>
            By using PromptPack, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>

          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> When you create an account, we collect your email address, name, and profile picture through our authentication provider (Clerk).</li>
            <li><strong>Prompts:</strong> The AI prompts you save using our Chrome extension are stored either locally on your device (Free tier) or in our cloud database (Pro tier).</li>
            <li><strong>Payment Information:</strong> When you upgrade to Pro, payment information is processed by Stripe. We do not store your full credit card details.</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Usage Data:</strong> We collect information about how you interact with our services, including the features you use and actions you take.</li>
            <li><strong>Device Information:</strong> We may collect information about your device, including browser type, operating system, and Chrome extension version.</li>
            <li><strong>Extension Activity:</strong> We track which LLM platforms (ChatGPT, Claude, Gemini) you save prompts from to improve our service.</li>
          </ul>

          <h3>2.3 Information We Do NOT Collect</h3>
          <ul>
            <li>We do NOT collect or read the content of your conversations with AI chatbots</li>
            <li>We do NOT track your browsing history outside of supported LLM platforms</li>
            <li>We do NOT sell your data to third parties</li>
            <li>We do NOT display advertisements based on your prompt content</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li><strong>Service Delivery:</strong> To provide, maintain, and improve our Chrome extension and web application</li>
            <li><strong>Cloud Sync:</strong> To sync your saved prompts across devices (Pro tier only)</li>
            <li><strong>Authentication:</strong> To verify your identity and manage your account</li>
            <li><strong>Payment Processing:</strong> To process subscription payments and manage billing</li>
            <li><strong>Customer Support:</strong> To respond to your inquiries and provide technical support</li>
            <li><strong>Service Improvements:</strong> To analyze usage patterns and improve our features</li>
            <li><strong>Security:</strong> To detect, prevent, and address technical issues and fraudulent activity</li>
            <li><strong>Communications:</strong> To send you service-related announcements and updates (you can opt-out of marketing emails)</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage and Security</h2>

          <h3>4.1 Where Your Data is Stored</h3>
          <ul>
            <li><strong>Free Tier:</strong> Prompts are stored locally in your browser using Chrome's storage API. This data never leaves your device unless you manually export it.</li>
            <li><strong>Pro Tier:</strong> Prompts are stored in Cloudflare R2 (object storage) and metadata is stored in Convex (serverless database). Your data is stored in secure, geographically distributed data centers.</li>
          </ul>

          <h3>4.2 Security Measures</h3>
          <p>We implement industry-standard security measures to protect your data:</p>
          <ul>
            <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers uses HTTPS/TLS encryption</li>
            <li><strong>Encryption at Rest:</strong> Your prompt packs can be encrypted with AES-GCM encryption (password-protected)</li>
            <li><strong>Access Control:</strong> Your data is only accessible to you and authorized personnel for support purposes</li>
            <li><strong>Secure Authentication:</strong> We use Clerk for authentication with industry-standard OAuth 2.0</li>
            <li><strong>Regular Updates:</strong> We regularly update our security practices and monitor for vulnerabilities</li>
          </ul>

          <h3>4.3 Data Retention</h3>
          <ul>
            <li><strong>Active Accounts:</strong> We retain your data for as long as your account is active</li>
            <li><strong>Deleted Accounts:</strong> When you delete your account, we remove your personal data within 30 days</li>
            <li><strong>Pro Subscription Cancellation:</strong> After cancellation, Pro users have a grace period to export their data before custom packs are deleted</li>
            <li><strong>Legal Requirements:</strong> We may retain certain data if required by law or for legitimate business purposes</li>
          </ul>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>We use the following third-party services to provide our application:</p>

          <h3>5.1 Clerk (Authentication)</h3>
          <ul>
            <li><strong>Purpose:</strong> User authentication and account management</li>
            <li><strong>Data Shared:</strong> Email address, name, profile picture</li>
            <li><strong>Privacy Policy:</strong> <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">https://clerk.com/privacy</a></li>
          </ul>

          <h3>5.2 Stripe (Payment Processing)</h3>
          <ul>
            <li><strong>Purpose:</strong> Process subscription payments</li>
            <li><strong>Data Shared:</strong> Payment information, billing address, email</li>
            <li><strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a></li>
          </ul>

          <h3>5.3 Convex (Database)</h3>
          <ul>
            <li><strong>Purpose:</strong> Store user data and prompt metadata</li>
            <li><strong>Data Shared:</strong> User account information, prompt metadata</li>
            <li><strong>Privacy Policy:</strong> <a href="https://www.convex.dev/privacy" target="_blank" rel="noopener noreferrer">https://www.convex.dev/privacy</a></li>
          </ul>

          <h3>5.4 Cloudflare (Infrastructure)</h3>
          <ul>
            <li><strong>Purpose:</strong> Cloud storage (R2) and API hosting (Workers)</li>
            <li><strong>Data Shared:</strong> Prompt pack files, API requests</li>
            <li><strong>Privacy Policy:</strong> <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com/privacypolicy/</a></li>
          </ul>

          <p>
            These third-party services have their own privacy policies governing the use of your information. We encourage you to review their privacy policies.
          </p>
        </section>

        <section>
          <h2>6. Chrome Extension Permissions</h2>
          <p>Our Chrome extension requests the following permissions:</p>
          <ul>
            <li><strong>storage:</strong> To save your prompts locally on your device</li>
            <li><strong>unlimitedStorage:</strong> To allow Pro users to save more prompts without quota limitations</li>
            <li><strong>tabs:</strong> To detect which LLM platform you're currently using</li>
            <li><strong>identity:</strong> To authenticate your account with our web application</li>
          </ul>
          <p>
            We only access websites you explicitly use the extension on (ChatGPT, Claude, Gemini, and our web app at pmtpk.com). We do not track your browsing activity on other websites.
          </p>
        </section>

        <section>
          <h2>7. Your Privacy Rights</h2>
          <p>You have the following rights regarding your personal data:</p>

          <h3>7.1 Access and Portability</h3>
          <ul>
            <li><strong>View Your Data:</strong> You can view all your saved prompts in the extension popup and web dashboard</li>
            <li><strong>Export Your Data:</strong> You can export your prompts as .pmtpk files at any time</li>
            <li><strong>Data Format:</strong> Exported files are in a portable format that can be imported back into PromptPack</li>
          </ul>

          <h3>7.2 Modification and Deletion</h3>
          <ul>
            <li><strong>Edit Prompts:</strong> You can modify or delete individual prompts at any time</li>
            <li><strong>Delete Account:</strong> You can delete your account by contacting support at <a href="mailto:sathvik.work@gmail.com">sathvik.work@gmail.com</a></li>
            <li><strong>Revoke Access:</strong> You can uninstall the extension to stop data collection</li>
          </ul>

          <h3>7.3 Opt-Out Rights</h3>
          <ul>
            <li><strong>Marketing Emails:</strong> You can opt-out of promotional emails by clicking the unsubscribe link</li>
            <li><strong>Cloud Sync:</strong> Free tier users' data stays local; Pro users can downgrade to stop cloud sync</li>
          </ul>

          <h3>7.4 Residents of the EU/EEA (GDPR Rights)</h3>
          <p>If you are located in the European Union or European Economic Area, you have additional rights under GDPR:</p>
          <ul>
            <li>Right to access your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent</li>
          </ul>

          <h3>7.5 California Residents (CCPA Rights)</h3>
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
            To exercise any of these rights, please contact us at <a href="mailto:sathvik.work@gmail.com">sathvik.work@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            PromptPack is not intended for use by children under the age of 13 (or 16 in the EU). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at <a href="mailto:sathvik.work@gmail.com">sathvik.work@gmail.com</a>, and we will delete the information.
          </p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure that adequate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
          </p>
          <p>
            Our services use cloud infrastructure that may process data in multiple regions including the United States and Europe. By using our services, you consent to these transfers.
          </p>
        </section>

        <section>
          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. When we make changes:
          </p>
          <ul>
            <li>We will update the "Last Updated" date at the top of this page</li>
            <li>For material changes, we will notify you via email or through the extension</li>
            <li>Your continued use of PromptPack after changes constitutes acceptance of the updated policy</li>
          </ul>
          <p>
            We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
          </p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <ul className="contact-info">
            <li><strong>Email:</strong> <a href="mailto:sathvik.work@gmail.com">sathvik.work@gmail.com</a></li>
            <li><strong>Website:</strong> <a href="https://pmtpk.com" target="_blank" rel="noopener noreferrer">https://pmtpk.com</a></li>
            <li><strong>Response Time:</strong> We aim to respond to all inquiries within 48 hours</li>
          </ul>
        </section>

        <section>
          <h2>12. Data Security Incident Response</h2>
          <p>
            In the unlikely event of a data breach that affects your personal information, we will:
          </p>
          <ul>
            <li>Notify you within 72 hours of discovering the breach</li>
            <li>Provide details about what information was compromised</li>
            <li>Explain the steps we're taking to address the breach</li>
            <li>Offer guidance on how you can protect yourself</li>
            <li>Comply with all applicable data breach notification laws</li>
          </ul>
        </section>

        <section className="summary">
          <h2>Summary</h2>
          <p>
            <strong>In simple terms:</strong> PromptPack collects only the information necessary to provide our service. We store your prompts securely, don't sell your data, and give you full control over your information. Free tier data stays on your device; Pro tier data is synced to secure cloud storage. You can export or delete your data at any time.
          </p>
        </section>

        <div className="back-home">
          <Link href="/">← Back to Home</Link>
        </div>
      </div>

      <style jsx>{`
        .privacy-container {
          min-height: 100vh;
          background: var(--background);
          color: var(--foreground);
          padding: 2rem 1rem;
        }

        .privacy-content {
          max-width: 800px;
          margin: 0 auto;
          background: var(--card-background, rgba(255, 255, 255, 0.05));
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: var(--primary, #8b5cf6);
        }

        .last-updated {
          color: var(--muted-foreground, #888);
          margin-bottom: 2rem;
          font-size: 0.9rem;
        }

        section {
          margin-bottom: 2.5rem;
        }

        h2 {
          font-size: 1.75rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: var(--primary, #8b5cf6);
          border-bottom: 2px solid var(--border, rgba(255, 255, 255, 0.1));
          padding-bottom: 0.5rem;
        }

        h3 {
          font-size: 1.25rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--foreground);
        }

        p {
          line-height: 1.8;
          margin-bottom: 1rem;
          color: var(--muted-foreground, #ccc);
        }

        ul {
          margin: 1rem 0 1.5rem 0;
          padding-left: 1.5rem;
        }

        li {
          margin-bottom: 0.75rem;
          line-height: 1.6;
          color: var(--muted-foreground, #ccc);
        }

        strong {
          color: var(--foreground);
          font-weight: 600;
        }

        a {
          color: var(--primary, #8b5cf6);
          text-decoration: none;
          transition: color 0.2s;
        }

        a:hover {
          color: var(--primary-hover, #a78bfa);
          text-decoration: underline;
        }

        .contact-info {
          list-style: none;
          padding-left: 0;
        }

        .contact-info li {
          margin-bottom: 0.5rem;
        }

        .summary {
          background: var(--accent-background, rgba(139, 92, 246, 0.1));
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid var(--primary, #8b5cf6);
        }

        .summary p {
          margin: 0;
          color: var(--foreground);
        }

        .back-home {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          text-align: center;
        }

        .back-home a {
          font-size: 1.1rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .privacy-content {
            padding: 2rem 1.5rem;
          }

          h1 {
            font-size: 2rem;
          }

          h2 {
            font-size: 1.5rem;
          }

          h3 {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
}
