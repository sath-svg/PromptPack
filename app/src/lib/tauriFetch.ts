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

  try {
    const result = await invoke<ProxyFetchResponse>('proxy_fetch', {
      request: { url, method, headers, body },
    });

    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    });
  } catch (err) {
    throw new TypeError(`Network request failed: ${err}`);
  }
}
