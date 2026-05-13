// Service Worker for Skillset PWA
// Bump CACHE_NAME to force old clients to invalidate the previous SW that
// intercepted OAuth callbacks and broke Set-Cookie on the auth redirect chain.
const CACHE_NAME = 'skillset-v2';

// Install event - cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - bypass SW entirely for anything that must preserve cookies,
// redirects, or POST semantics. Specifically:
//   - Non-GET requests (BetterAuth sign-in is POST)
//   - Any /api/* path (auth callbacks, Stripe, Convex proxies, etc.)
//   - Cross-origin requests (OAuth provider redirects)
//   - Navigation requests (top-level page loads — let the browser handle
//     redirect chains natively so Set-Cookie survives)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up')) return;

  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
