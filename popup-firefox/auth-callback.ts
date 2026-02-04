// Auth callback handler for PromptPack
import { handleAuthCallback } from "./shared/auth";

async function main() {
  const spinner = document.getElementById("spinner");
  const title = document.getElementById("title");
  const message = document.getElementById("message");

  // Read params from search params (code and state should be in query string from extension redirect)
  const params = new URLSearchParams(window.location.search);
  
  // Fallback: also check hash if params are missing (shouldn't normally happen, but defensive)
  if ((!params.get("code") || !params.get("state")) && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    
    if (!params.get("state")) {
      const hashState = hashParams.get("state");
      if (hashState) {
        params.set("state", hashState);
      }
    }
    
    if (!params.get("code")) {
      const hashCode = hashParams.get("code");
      if (hashCode) {
        params.set("code", hashCode);
      }
    }
  }

  try {
    const success = await handleAuthCallback(params);

    if (spinner) spinner.style.display = "none";

    if (success) {
      if (title) {
        title.textContent = "Success!";
        title.classList.add("success");
      }
      if (message) {
        message.textContent = "You're now signed in. You can close this tab if it does not redirect automatically.";
      }

      // Close tab after a short delay
      setTimeout(() => window.close(), 1500);
    } else {
      if (title) {
        title.textContent = "Authentication Failed";
        title.classList.add("error");
      }
      if (message) {
        message.textContent = "Something went wrong. Please try again.";
      }
    }
  } catch {
    if (spinner) spinner.style.display = "none";
    if (title) {
      title.textContent = "Error";
      title.classList.add("error");
    }
    if (message) {
      message.textContent = "An unexpected error occurred. Please try again.";
    }
  }
}

main();
