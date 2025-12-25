import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, fileData, promptCount, version, price, isPublic } = body;

    // Validate required fields
    if (!title || !fileData || typeof promptCount !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user from Convex by Clerk ID
    let convexUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    // If user doesn't exist, create them
    if (!convexUser) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses[0]?.emailAddress || "";

      await convex.mutation(api.users.upsert, {
        clerkId: userId,
        email,
        name: clerkUser?.firstName || undefined,
        imageUrl: clerkUser?.imageUrl || undefined,
        plan: "free",
      });

      // Fetch the created user
      convexUser = await convex.query(api.users.getByClerkId, {
        clerkId: userId,
      });
    }

    if (!convexUser) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 }
      );
    }

    // Create pack in Convex
    const packId = await convex.mutation(api.packs.create, {
      authorId: convexUser._id,
      title,
      fileData,
      promptCount,
      version: version || "1.0",
      price: price || 0,
      isPublic: isPublic || false,
    });

    return NextResponse.json({
      success: true,
      packId,
    });
  } catch (error) {
    console.error("Create pack error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
