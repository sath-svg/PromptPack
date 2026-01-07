import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { R2_API_URL } from "../../../../lib/constants";

function inferIsEncrypted(fileData: string): boolean {
  if (!fileData.startsWith("UFBLA")) {
    return false;
  }

  const buffer = Buffer.from(fileData, "base64");
  if (buffer.length < 4) {
    return false;
  }

  return buffer[0] === 0x50 && buffer[1] === 0x50 && buffer[2] === 0x4B && buffer[3] === 0x01;
}

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
    const { id, fileData, promptCount } = body;

    // Validate required fields
    if (!id || !fileData || typeof promptCount !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const resolvedIsEncrypted = inferIsEncrypted(fileData);

    // Get the existing pack to verify ownership and get r2Key
    const pack = await convex.query(api.packs.get, { id: id as Id<"userPacks"> });

    if (!pack) {
      return NextResponse.json(
        { error: "Pack not found" },
        { status: 404 }
      );
    }

    // Get user from Convex by Clerk ID to verify ownership
    const convexUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    if (!convexUser || pack.authorId !== convexUser._id) {
      return NextResponse.json(
        { error: "Unauthorized - not pack owner" },
        { status: 403 }
      );
    }

    // Use existing r2Key from pack
    const r2Key = pack.r2Key;

    // Calculate file size from base64
    const fileSize = Math.ceil((fileData.length * 3) / 4);

    try {
      // Upload updated file to R2 (overwrites existing)
      const r2Response = await fetch(`${R2_API_URL}/storage/pack-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          r2Key,
          fileData, // base64 encoded .pmtpk
          metadata: {
            title: pack.title,
            authorId: userId,
            promptCount: promptCount.toString(),
            version: pack.version || "1.0",
            isEncrypted: resolvedIsEncrypted ? "true" : "false",
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

    // Update metadata in Convex
    await convex.mutation(api.packs.update, {
      id: id as Id<"userPacks">,
      promptCount,
      fileSize,
      isEncrypted: resolvedIsEncrypted,
    });

    return NextResponse.json({
      success: true,
      packId: id,
      r2Key,
    });
  } catch (error) {
    console.error("Update pack error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
