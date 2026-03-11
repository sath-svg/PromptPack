export function ExtraFeatures() {
  return (
    <section className="extras-section" id="beyond-the-extension">
      <div className="extras-inner">
        <h2 className="upcoming-title">
          Beyond the Extension
        </h2>
        <p className="extras-subtitle">
          Features built for power users — available in the desktop app, CLI, and AI agents.
        </p>

        <div className="extras-grid extras-grid-3col">

          {/* Claude Skill Export */}
          <div className="extras-card">
            <div className="extras-card-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="4" width="26" height="34" rx="3" stroke="#6366f1" strokeWidth="2" fill="rgba(99, 102, 241, 0.08)" />
                <path d="M27 4v7a2 2 0 0 0 2 2h5" stroke="#6366f1" strokeWidth="2" fill="none" />
                <line x1="13" y1="17" x2="25" y2="17" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="13" y1="21" x2="22" y2="21" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="13" y1="25" x2="25" y2="25" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="13" y1="29" x2="20" y2="29" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                <g transform="translate(28, 24)">
                  <circle cx="8" cy="8" r="10" fill="#0a0a0a" />
                  <circle cx="8" cy="8" r="9" stroke="#6366f1" strokeWidth="1.5" fill="rgba(99, 102, 241, 0.12)" />
                  <path d="M5 4L11 12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 12L3 12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
            </div>
            <div className="extras-card-badge">Desktop</div>
            <h3>Claude Skill Export</h3>
            <p>
              Convert any <span className="gradient-text">PromptPack</span> into a Claude Skill
              — a slash command that runs your entire workflow
              inside Claude Code or Claude Desktop.
            </p>
          </div>

          {/* Prompt Evaluation */}
          <div className="extras-card">
            <div className="extras-card-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 32 A16 16 0 0 1 40 32" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M8 32 A16 16 0 0 1 37.5 18.5" stroke="url(#evalGradient)" strokeWidth="4" strokeLinecap="round" fill="none" />
                <text x="24" y="30" textAnchor="middle" fill="#ededed" fontSize="12" fontWeight="700" fontFamily="system-ui">78</text>
                <text x="24" y="38" textAnchor="middle" fill="#d1d5db" fontSize="6" fontFamily="system-ui">/100</text>
                <circle cx="8" cy="32" r="2" fill="#ef4444" opacity="0.6" />
                <circle cx="14" cy="18" r="2" fill="#f59e0b" opacity="0.6" />
                <circle cx="40" cy="32" r="2" fill="#22c55e" opacity="0.6" />
                <defs>
                  <linearGradient id="evalGradient" x1="8" y1="32" x2="38" y2="18">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="extras-card-badge">Pro</div>
            <h3>Prompt Evaluation</h3>
            <p>
              Score every prompt from 0–100 across 7 LLMs — ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, and Kimi.
              Know if your prompt is good <em>before</em> you use it.
            </p>
          </div>

          {/* Modular PromptPacks */}
          <div className="extras-card">
            <div className="extras-card-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14 10h8v4a3 3 0 1 0 6 0v-4h8a2 2 0 0 1 2 2v8h-4a3 3 0 1 0 0 6h4v8a2 2 0 0 1-2 2h-8v-4a3 3 0 1 0-6 0v4h-8a2 2 0 0 1-2-2v-8h4a3 3 0 1 0 0-6h-4v-8a2 2 0 0 1 2-2z"
                  stroke="#6366f1" strokeWidth="2" fill="rgba(99, 102, 241, 0.08)"
                />
                <text x="20" y="28" fill="#a78bfa" fontSize="10" fontFamily="monospace" fontWeight="700">&#123;&#125;</text>
              </svg>
            </div>
            <div className="extras-card-badge">Pro</div>
            <h3>Modular <span className="gradient-text">PromptPacks</span></h3>
            <p>
              Add dynamic <code>{"{Variables}"}</code> to your prompts. When you run a pack,
              it asks for your inputs — making every prompt reusable and customizable.
            </p>
          </div>

          {/* Workflow Automation */}
          <div className="extras-card">
            <div className="extras-card-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 8l2.5 3.5a12 12 0 0 1 4.3 1.8L35 11l2 3.5-3.2 2.2a12 12 0 0 1 1.8 4.3H40v4h-4.4a12 12 0 0 1-1.8 4.3L37 31.5 35 35l-4.2-2.3a12 12 0 0 1-4.3 1.8L24 38l-2.5-3.5a12 12 0 0 1-4.3-1.8L13 35l-2-3.5 3.2-2.2a12 12 0 0 1-1.8-4.3H8v-4h4.4a12 12 0 0 1 1.8-4.3L11 14.5 13 11l4.2 2.3a12 12 0 0 1 4.3-1.8L24 8z"
                  stroke="#6366f1" strokeWidth="2" fill="rgba(99, 102, 241, 0.08)" strokeLinejoin="round"
                />
                <circle cx="24" cy="23" r="5" stroke="#8b5cf6" strokeWidth="2" fill="none" />
                <path d="M22 23h4" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                <path d="M25 21l2 2-2 2" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="extras-card-badge">MCP</div>
            <h3>Workflow Automation</h3>
            <p>
              Chain prompts together as multi-step workflows. Run them through Claude Skills or
              the MCP server to automate your AI-powered processes end to end.
            </p>
          </div>

          {/* MCP Server */}
          <div className="extras-card">
            <div className="extras-card-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="8" width="40" height="32" rx="4" stroke="#6366f1" strokeWidth="2" fill="rgba(99, 102, 241, 0.06)" />
                <line x1="4" y1="16" x2="44" y2="16" stroke="#6366f1" strokeWidth="1" opacity="0.3" />
                <circle cx="10" cy="12" r="1.5" fill="#ef4444" opacity="0.7" />
                <circle cx="15" cy="12" r="1.5" fill="#f59e0b" opacity="0.7" />
                <circle cx="20" cy="12" r="1.5" fill="#22c55e" opacity="0.7" />
                <text x="10" y="25" fill="#8b5cf6" fontSize="7" fontFamily="monospace" fontWeight="600">$</text>
                <text x="17" y="25" fill="#d1d5db" fontSize="7" fontFamily="monospace">npx -y pmtpk</text>
                <line x1="10" y1="31" x2="16" y2="31" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                <text x="18" y="32" fill="#22c55e" fontSize="6" fontFamily="monospace" opacity="0.8">connected</text>
                <circle cx="10" cy="36" r="1" fill="#6366f1" opacity="0.6">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="15" cy="36" r="1" fill="#6366f1" opacity="0.8">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="20" cy="36" r="1" fill="#6366f1" opacity="0.4">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.6s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <div className="extras-card-badge">CLI</div>
            <h3>MCP Server</h3>
            <p>
              Access your packs from any AI agent via <code>npx -y pmtpk</code>.
              Run <span className="gradient-text">PromptPacks</span> in Claude Code & OpenClaw 🦀.
            </p>
          </div>

          {/* Marketplace - Coming Soon */}
          <div className="extras-card extras-card-glow">
            <div className="extras-card-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Storefront roof */}
                <path d="M6 20L10 8h28l4 12" stroke="#8b5cf6" strokeWidth="2" fill="rgba(99, 102, 241, 0.1)" strokeLinejoin="round" />
                {/* Awning scallops */}
                <path d="M6 20c0 3 2.5 4 4 4s4-1 4-4" stroke="#a78bfa" strokeWidth="1.5" fill="none" />
                <path d="M14 20c0 3 2.5 4 4 4s4-1 4-4" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
                <path d="M22 20c0 3 2.5 4 4 4s4-1 4-4" stroke="#a78bfa" strokeWidth="1.5" fill="none" />
                <path d="M30 20c0 3 2.5 4 4 4s4-1 4-4" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
                <path d="M38 20c0 3 2.5 4 4 4s4-1 4-4" stroke="#a78bfa" strokeWidth="1.5" fill="none" />
                {/* Store body */}
                <rect x="8" y="24" width="32" height="16" stroke="#6366f1" strokeWidth="2" fill="rgba(99, 102, 241, 0.05)" />
                {/* Door */}
                <rect x="20" y="30" width="8" height="10" rx="1" stroke="#8b5cf6" strokeWidth="1.5" fill="rgba(139, 92, 246, 0.1)" />
                <circle cx="26" cy="35" r="0.8" fill="#a78bfa" />
                {/* Window left */}
                <rect x="11" y="27" width="6" height="5" rx="0.5" stroke="#6366f1" strokeWidth="1" fill="rgba(99, 102, 241, 0.08)" />
                {/* Window right */}
                <rect x="31" y="27" width="6" height="5" rx="0.5" stroke="#6366f1" strokeWidth="1" fill="rgba(99, 102, 241, 0.08)" />
              </svg>
            </div>
            <div className="extras-card-badge extras-card-badge-soon">Coming Soon</div>
            <h3><span className="gradient-text">PromptPack</span> Marketplace</h3>
            <p>
              Discover and purchase curated <span className="gradient-text">PromptPacks</span> from creators.
              Monetize your expertise by selling your workflows.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
