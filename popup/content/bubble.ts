/**
 * Suggestion Bubble for prompting users to save good prompts
 * Uses randomized pre-written suggestions
 */

interface BubbleConfig {
  primaryColor: string;
  hoverColor: string;
  textColor: string;
}

// Pre-written suggestion prompts - varied and friendly
const SUGGESTION_PROMPTS = [
  "How good was the prompt?",
  "Did you find this prompt helpful?",
  "Was this prompt useful to you?",
  "Did the prompt work well for you?",
  "Found the prompt effective?",
  "How well did that prompt perform?",
  "Did this prompt hit the mark?",
  "Was the prompt what you needed?",
  "Did the prompt deliver results?",
  "Found the prompt valuable?",
];

/**
 * Get a random suggestion from the predefined list
 */
function getRandomSuggestion(): string {
  const randomIndex = Math.floor(Math.random() * SUGGESTION_PROMPTS.length);
  return SUGGESTION_PROMPTS[randomIndex];
}

/**
 * Create and show the suggestion bubble
 */
export async function showSuggestionBubble(
  config: BubbleConfig,
  onSave: () => void
): Promise<void> {
  // Remove any existing bubble
  const existingBubble = document.querySelector(".promptpack-suggestion-bubble");
  if (existingBubble) {
    existingBubble.remove();
  }

  // Get a random suggestion
  const suggestionText = getRandomSuggestion();

  // Create bubble container
  const bubble = document.createElement("div");
  bubble.className = "promptpack-suggestion-bubble";
  bubble.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 2px solid ${config.primaryColor};
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    animation: slideInUp 0.3s ease-out;
    max-width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  // Add animation keyframes
  if (!document.querySelector("#promptpack-bubble-styles")) {
    const style = document.createElement("style");
    style.id = "promptpack-bubble-styles";
    style.textContent = `
      @keyframes slideInUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes slideOutDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(20px);
          opacity: 0;
        }
      }
      .promptpack-suggestion-bubble.hiding {
        animation: slideOutDown 0.3s ease-in forwards;
      }
    `;
    document.head.appendChild(style);
  }

  // Suggestion text
  const text = document.createElement("span");
  text.textContent = suggestionText;
  text.style.cssText = `
    color: #333;
    font-size: 14px;
    font-weight: 500;
    flex: 1;
  `;

  // Save button
  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.title = "Save this prompt";
  saveButton.style.cssText = `
    background: ${config.primaryColor};
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  saveButton.onmouseenter = () => {
    saveButton.style.background = config.hoverColor;
    saveButton.style.transform = "scale(1.05)";
  };
  saveButton.onmouseleave = () => {
    saveButton.style.background = config.primaryColor;
    saveButton.style.transform = "scale(1)";
  };
  saveButton.onclick = () => {
    onSave();
    hideBubble(bubble);
  };

  // Close button (X)
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "×";
  closeButton.title = "Dismiss";
  closeButton.style.cssText = `
    background: transparent;
    border: none;
    padding: 4px 8px;
    font-size: 24px;
    line-height: 1;
    color: #999;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
  `;
  closeButton.onmouseenter = () => {
    closeButton.style.color = "#333";
    closeButton.style.transform = "scale(1.1)";
  };
  closeButton.onmouseleave = () => {
    closeButton.style.color = "#999";
    closeButton.style.transform = "scale(1)";
  };
  closeButton.onclick = () => {
    hideBubble(bubble);
  };

  // Assemble bubble
  bubble.appendChild(text);
  bubble.appendChild(saveButton);
  bubble.appendChild(closeButton);

  // Add to page
  document.body.appendChild(bubble);

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (bubble.parentElement) {
      hideBubble(bubble);
    }
  }, 10000);
}

/**
 * Hide and remove the bubble with animation
 */
function hideBubble(bubble: HTMLElement): void {
  bubble.classList.add("hiding");
  setTimeout(() => {
    if (bubble.parentElement) {
      bubble.remove();
    }
  }, 300);
}

/**
 * Initialize suggestions (no-op since we use static prompts)
 */
export function initializeSuggestions(): void {
  // No initialization needed - we use static prompts
}
