type CheckoutInterval = "month" | "annual";

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data?.error || "Billing request failed";
  } catch {
    return "Billing request failed";
  }
}

export async function startStripeCheckout(interval: CheckoutInterval): Promise<void> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interval }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { url?: string };
  if (!data?.url) {
    throw new Error("Checkout URL missing");
  }

  window.location.assign(data.url);
}

export async function openStripeCustomerPortal(): Promise<void> {
  const response = await fetch("/api/stripe/portal", { method: "POST" });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { url?: string };
  if (!data?.url) {
    throw new Error("Portal URL missing");
  }

  window.location.assign(data.url);
}
