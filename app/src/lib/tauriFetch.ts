import { invoke } from '@tauri-apps/api/core';

interface ProxyFetchResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Proxies HTTP requests through Tauri's Rust backend using reqwest,
 * which auto-detects system proxy settings and trusts OS certificates.
 * Drop-in replacement for fetch() — returns a real Response object.
 */
export async function tauriFetch(url: string, init?: RequestInit): Promise<Response> {
  const method = init?.method || 'GET';
  const headers: Record<string, string> = {};

  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => { headers[key] = value; });
    } else if (Array.isArray(init.headers)) {
      for (const [key, value] of init.headers) { headers[key] = value; }
    } else {
      Object.assign(headers, init.headers);
    }
  }

  const body = typeof init?.body === 'string' ? init.body : undefined;
  const signal = init?.signal;

  // Short-circuit if the caller's signal is already aborted — saves a
  // round-trip when the user clicks Stop before the next round fires.
  if (signal?.aborted) {
    throw new DOMException('aborted', 'AbortError');
  }

  try {
    const invokeP = invoke<ProxyFetchResponse>('proxy_fetch', {
      request: { url, method, headers, body },
    });
    // Race the invoke against the caller's AbortSignal so user-cancel
    // surfaces to JS the moment they click Stop. The Rust `proxy_fetch`
    // command does NOT natively support cancellation (Tauri 2 doesn't
    // expose a built-in command-abort primitive), so the HTTP request
    // on the Rust side continues to completion — but its result is
    // ignored, and the caller's loop bails out at the next signal
    // check. From the user's perspective: Stop = immediate halt.
    const result = signal
      ? await Promise.race([
          invokeP,
          new Promise<ProxyFetchResponse>((_, reject) => {
            signal.addEventListener(
              'abort',
              () => reject(new DOMException('aborted', 'AbortError')),
              { once: true },
            );
          }),
        ])
      : await invokeP;

    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    });
  } catch (err) {
    // Propagate AbortError untouched so callers can distinguish user
    // cancel from real network failure.
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    // Surface the raw reqwest error string + URL + body size so devtools
    // can tell DNS / TLS / timeout / payload-too-large apart at a glance.
    const detail = err instanceof Error ? err.message : String(err);
    const bodyHint = body ? ` [body=${body.length}B]` : '';
    console.error('[tauriFetch]', method, url, bodyHint, '→', detail);
    throw new TypeError(`Network request failed: ${detail} — ${method} ${url}${bodyHint}`);
  }
}
