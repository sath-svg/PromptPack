// Auth callback handler for PromptPack
import { handleAuthCallback } from "./shared/auth";

async function main() {
  const spinner = document.getElementById("spinner");
  const title = document.getElementById("title");
  const message = document.getElementById("message");

  const params = new URLSearchParams(window.location.search);

  try {
    const success = await handleAuthCallback(params);

    if (spinner) spinner.style.display = "none";

    if (success) {
      if (title) {
        title.textContent = "Success!";
        title.classList.add("success");
      }
      if (message) {
        message.textContent = "You're now signed in. You can close this tab.";
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
  } catch (e) {
    console.error("Auth callback error:", e);

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
