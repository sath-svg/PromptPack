import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({})) as {
      listingId?: string;
    };

    if (!body.listingId) {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    const listingId = body.listingId as Id<"marketplaceListings">;

    // Get listing details
    const listing = await convexClient.query(api.listings.getWithAuthor, { id: listingId });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "published") {
      return NextResponse.json({ error: "Listing is not available" }, { status: 400 });
    }

    if (listing.pricingModel === "free") {
      return NextResponse.json({ error: "This is a free listing" }, { status: 400 });
    }

    if (!listing.pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    // Get user details
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "Missing user email" }, { status: 400 });
    }

    // Check if already purchased
    const convexUser = await convexClient.query(api.users.getByClerkId, { clerkId: userId });
    if (convexUser) {
      const hasPurchased = await convexClient.query(api.purchasedPacks.hasPurchasedListing, {
        userId: convexUser._id,
        listingId,
      });
      if (hasPurchased) {
        return NextResponse.json({ error: "Already purchased" }, { status: 400 });
      }
    }

    const origin = request.headers.get("origin")
      ?? process.env.NEXT_PUBLIC_APP_URL
      ?? "http://localhost:3000";

    // Create Stripe checkout session
    const session = await convexClient.action(api.stripe.createPackPurchaseCheckout, {
      clerkId: userId,
      email,
      name: user?.fullName ?? user?.firstName ?? undefined,
      listingId,
      packId: listing.pack.id,
      authorId: listing.authorId,
      priceInCents: listing.priceInCents,
      title: listing.title,
      successUrl: `${origin}/marketplace/${listingId}?purchased=true`,
      cancelUrl: `${origin}/marketplace/${listingId}/checkout?canceled=true`,
    });

    if (!session?.url) {
      return NextResponse.json({ error: "Checkout URL missing" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Pack checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start checkout" },
      { status: 500 }
    );
  }
}
