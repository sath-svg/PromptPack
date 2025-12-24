/**
 * Content script that runs on the extension-auth page
 * Captures auth data from localStorage and stores it in chrome.storage
 * so the popup can retrieve it when reopened
 */

function checkForAuthData() {
  const data = localStorage.getItem("pp_extension_auth");
  if (data) {
    try {
      const authData = JSON.parse(data);
      if (authData.code && authData.state) {
        // Store in chrome.storage for the popup to retrieve
        chrome.storage.local.set({
          pp_pending_auth: {
            code: authData.code,
            state: authData.state,
            timestamp: Date.now(),
          },
        });

        // Clear from localStorage
        localStorage.removeItem("pp_extension_auth");

        console.log("[PromptPack] Auth captured successfully");
      }
    } catch (e) {
      console.error("[PromptPack] Failed to parse auth data:", e);
    }
  }
}

// Check immediately
checkForAuthData();

// Also observe for changes (in case auth completes after page load)
const observer = new MutationObserver(() => {
  checkForAuthData();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Also check periodically for 30 seconds
let checks = 0;
const interval = setInterval(() => {
  checkForAuthData();
  checks++;
  if (checks > 30) {
    clearInterval(interval);
    observer.disconnect();
  }
}, 1000);
