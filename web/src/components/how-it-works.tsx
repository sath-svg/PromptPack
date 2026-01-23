"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/constants";

type ModalContent = {
  title: string;
  image: string;
  description: string;
} | null;

export function HowItWorks() {
  const [modalContent, setModalContent] = useState<ModalContent>(null);

  const openModal = (content: ModalContent) => {
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <>
      <section className="how-section">
        <div className="how-inner">
          <h2 className="how-title demo-title">How it works.</h2>
          <p className="how-subtitle">
            From a &quot;good prompt&quot; to reusable workflow — in under a minute.
          </p>

          <div className="how-steps how-steps-3col">
            <div
              className="how-step how-step-clickable"
              onClick={() => openModal({
                title: "Organize Your Prompts",
                image: "/img/PromptPack..png",
                description: "The extension is where you organize your prompts into different PromptPacks (folders). Headers are generated via AI based on your current plan limits, or you can add your own custom headers."
              })}
            >
              <div className="how-step-icon">⬇️</div>
              <h3>Download Extension</h3>
              <p>
                <span className="pro-link">Install</span> once and you&apos;re ready to save prompts anywhere.
              </p>
            </div>

            <div
              className="how-step how-step-clickable"
              onClick={() => openModal({
                title: "Save Your Prompts",
                image: "/img/Prompt box and bubble (Claude)..png",
                description: "The prompt box shows your input, and the bubble above contains the Save button. Click Save to capture your prompt instantly."
              })}
            >
              <div className="how-step-icon">💾</div>
              <h3>Hit <span className="gradient-text">Save</span></h3>
              <p>
                A Save button appears in the prompt box. Click to capture instantly.
              </p>
            </div>

            <div
              className="how-step how-step-clickable"
              onClick={() => openModal({
                title: "Enhance Your Prompts",
                image: "/img/Bubble dropdown..png",
                description: "The dropdown shows all available enhance styles: Structured, Clarity, Concise, and Strict. Choose the style that fits your needs."
              })}
            >
              <div className="how-step-icon">✨</div>
              <h3>Enhance Prompts</h3>
              <p>
                Press <code>Alt+Shift+E</code> to enhance your prompt with AI before sending.
              </p>
            </div>

            <div
              className="how-step how-step-clickable"
              onClick={() => openModal({
                title: "Quick-Select Prompts",
                image: "/img/Quick Select..png",
                description: "Right-click in the prompt box to see this dropdown. Instantly insert any saved prompt without leaving your chat."
              })}
            >
              <div className="how-step-icon">⚡</div>
              <h3>Quick-Select Prompts</h3>
              <p>
                Right-click in the prompt box to instantly insert any saved prompt.
              </p>
            </div>

            <Link href="/dashboard" className="how-step how-step-clickable how-step-link">
              <div className="how-step-icon">🔄</div>
              <h3>Sync to Dashboard</h3>
              <p>
                Log in to access your prompts and <span className="gradient-text">PromptPacks</span> anywhere.
              </p>
            </Link>

            <Link href="/pricing" className="how-step how-step-clickable how-step-link">
              <div className="how-step-icon">🚀</div>
              <h3>Go <span className="pro-link">Pro</span></h3>
              <p>
                Create, export, and share encrypted <span className="gradient-text">PromptPacks</span>.
              </p>
            </Link>
          </div>

          <div className="shortcuts-section">
            <h3 className="shortcuts-title">⌨️ Keyboard Shortcuts</h3>
            <div className="shortcuts-grid">
              <div className="shortcuts-group">
                <h4>Main Shortcuts</h4>
                <ul className="shortcuts-list">
                  <li><code>Alt+Shift+S</code> Save prompt</li>
                  <li><code>Alt+Shift+E</code> Enhance prompt</li>
                  <li><code>Right-click</code> Quick-select prompt</li>
                </ul>
              </div>
              <div className="shortcuts-group">
                <h4>Enhance Modes</h4>
                <ul className="shortcuts-list">
                  <li><code>Alt+1</code> Structured</li>
                  <li><code>Alt+2</code> Clarity</li>
                  <li><code>Alt+3</code> Concise</li>
                  <li><code>Alt+4</code> Strict</li>
                </ul>
              </div>
              <div className="shortcuts-group">
                <h4>Preview Actions</h4>
                <ul className="shortcuts-list">
                  <li><code>Ctrl+C</code> Copy enhanced text</li>
                  <li><code>Enter</code> Apply to composer</li>
                  <li><code>Escape</code> Cancel preview</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="how-footnote">
            Saving prompts for personal use? Free does the job. Building and sharing polished prompt packs? Go <Link className="pro-link" href="/pricing">Pro</Link>.
          </p>
        </div>
      </section>

      {/* Modal */}
      {modalContent && (
        <div className="how-modal-overlay" onClick={closeModal}>
          <div className={modalContent.title === "Save Your Prompts" ? "how-modal-prompt-box" : "how-modal"} onClick={(e) => e.stopPropagation()}>
            <button className="how-modal-close" onClick={closeModal}>×</button>
            <h3 className="how-modal-title">{modalContent.title}</h3>
            <div className="how-modal-image">
              <Image
                src={assetUrl(modalContent.image)}
                alt={modalContent.title}
                width={1908}
                height={604}
                style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
              />
            </div>
            <p className="how-modal-description">{modalContent.description}</p>
          </div>
        </div>
      )}
    </>
  );
}
