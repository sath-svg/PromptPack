import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { R2_API_URL } from "../../../../lib/constants";

export const runtime = "edge";

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
    const { title, fileData, promptCount, version, price, isPublic, isEncrypted } = body;

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

    // Step 1: Upload file to R2
    // Generate unique pack ID for R2 key
    const packId = `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const r2Key = `users/${userId}/userpacks/${packId}.pmtpk`;

    // Calculate file size from base64
    const fileSize = Math.ceil((fileData.length * 3) / 4); // Approximate size in bytes

    try {
      // Upload to R2 via Cloudflare Workers API
      const r2Response = await fetch(`${R2_API_URL}/storage/pack-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          r2Key,
          fileData, // base64 encoded .pmtpk
          metadata: {
            title,
            authorId: userId,
            promptCount: promptCount.toString(),
            version: version || "1.0",
            isEncrypted: isEncrypted ? "true" : "false",
          },
        }),
      });

      if (!r2Response.ok) {
        const errorText = await r2Response.text();
        console.error("R2 upload failed:", errorText);
        return NextResponse.json(
          { error: "Failed to upload pack to storage" },
          { status: 500 }
        );
      }

      const r2Result = await r2Response.json();
      console.log("R2 upload success:", r2Result);

    } catch (r2Error) {
      console.error("R2 upload error:", r2Error);
      return NextResponse.json(
        { error: "Failed to upload pack to storage" },
        { status: 500 }
      );
    }

    // Step 2: Save metadata to Convex
    const convexPackId = await convex.mutation(api.packs.create, {
      authorId: convexUser._id,
      title,
      r2Key, // Store R2 key instead of fileData
      promptCount,
      fileSize,
      version: version || "1.0",
      price: price || 0,
      isPublic: isPublic || false,
      isEncrypted: isEncrypted || false,
    });

    return NextResponse.json({
      success: true,
      packId: convexPackId,
      r2Key,
    });
  } catch (error) {
    console.error("Create pack error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
