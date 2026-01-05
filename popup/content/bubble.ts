/**
 * Suggestion Bubble for prompting users to save good prompts
 * Uses Ollama API to generate varied suggestion messages
 */

const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "llama3.2:1b";
const SUGGESTIONS_COUNT = 10;

// Session storage key for cached suggestions
const SUGGESTIONS_CACHE_KEY = "promptpack_suggestions_cache";

interface BubbleConfig {
  primaryColor: string;
  hoverColor: string;
  textColor: string;
}

/**
 * Generate 10 suggestion prompts using Ollama API
 */
async function generateSuggestions(): Promise<string[]> {
  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `Generate exactly 10 short, friendly variations of the question "How good was the prompt?". Each variation should:
- Be conversational and engaging
- Ask if the user found the prompt helpful/good/useful
- Be 5-10 words long
- Sound natural and varied
- NOT include numbering or bullet points

Format: Return only the 10 questions, one per line, nothing else.

Examples:
Did you find that prompt helpful?
Was this prompt useful to you?
How well did that prompt work?
Found the prompt effective?
Did this prompt hit the mark?`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.response || "";

    // Parse the response into individual suggestions
    const suggestions = text
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line.length < 100)
      .slice(0, SUGGESTIONS_COUNT);

    // Fallback if we don't get enough suggestions
    if (suggestions.length < SUGGESTIONS_COUNT) {
      return [
        ...suggestions,
        "How good was the prompt?",
        "Did you find this prompt helpful?",
        "Was this prompt useful?",
        "Did the prompt work well?",
        "Found the prompt effective?",
        "How well did that prompt perform?",
        "Did this prompt hit the mark?",
        "Was the prompt what you needed?",
        "Did the prompt deliver results?",
        "Found the prompt valuable?",
      ].slice(0, SUGGESTIONS_COUNT);
    }

    return suggestions;
  } catch (error) {
    console.warn("Failed to generate suggestions from Ollama, using fallbacks:", error);
    // Fallback suggestions if Ollama is not available
    return [
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
  }
}

/**
 * Get suggestions from session cache or generate new ones
 */
async function getSuggestions(): Promise<string[]> {
  try {
    const cached = sessionStorage.getItem(SUGGESTIONS_CACHE_KEY);
    if (cached) {
      const suggestions = JSON.parse(cached);
      if (Array.isArray(suggestions) && suggestions.length === SUGGESTIONS_COUNT) {
        return suggestions;
      }
    }
  } catch (error) {
    console.warn("Failed to read cached suggestions:", error);
  }

  // Generate new suggestions and cache them for this session
  const suggestions = await generateSuggestions();
  try {
    sessionStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify(suggestions));
  } catch (error) {
    console.warn("Failed to cache suggestions:", error);
  }

  return suggestions;
}

/**
 * Get a random suggestion from the cached pool
 */
async function getRandomSuggestion(): Promise<string> {
  const suggestions = await getSuggestions();
  const randomIndex = Math.floor(Math.random() * suggestions.length);
  return suggestions[randomIndex];
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
  const suggestionText = await getRandomSuggestion();

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

  // Thumbs up button
  const thumbsUp = document.createElement("button");
  thumbsUp.innerHTML = "👍";
  thumbsUp.title = "Save this prompt";
  thumbsUp.style.cssText = `
    background: ${config.primaryColor};
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  thumbsUp.onmouseenter = () => {
    thumbsUp.style.background = config.hoverColor;
    thumbsUp.style.transform = "scale(1.1)";
  };
  thumbsUp.onmouseleave = () => {
    thumbsUp.style.background = config.primaryColor;
    thumbsUp.style.transform = "scale(1)";
  };
  thumbsUp.onclick = () => {
    onSave();
    hideBubble(bubble);
  };

  // Thumbs down button
  const thumbsDown = document.createElement("button");
  thumbsDown.innerHTML = "👎";
  thumbsDown.title = "Dismiss";
  thumbsDown.style.cssText = `
    background: #f0f0f0;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  thumbsDown.onmouseenter = () => {
    thumbsDown.style.background = "#e0e0e0";
    thumbsDown.style.transform = "scale(1.1)";
  };
  thumbsDown.onmouseleave = () => {
    thumbsDown.style.background = "#f0f0f0";
    thumbsDown.style.transform = "scale(1)";
  };
  thumbsDown.onclick = () => {
    hideBubble(bubble);
  };

  // Assemble bubble
  bubble.appendChild(text);
  bubble.appendChild(thumbsUp);
  bubble.appendChild(thumbsDown);

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
 * Pre-generate suggestions for the session (call this on extension load)
 */
export async function initializeSuggestions(): Promise<void> {
  // Check if we already have suggestions for this session
  try {
    const cached = sessionStorage.getItem(SUGGESTIONS_CACHE_KEY);
    if (!cached) {
      // Generate suggestions in the background
      await getSuggestions();
    }
  } catch (error) {
    console.warn("Failed to initialize suggestions:", error);
  }
}
