import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    return NextResponse.json({
      isAuthenticated: !!userId,
    });
  } catch (error) {
    console.error("Auth status check error:", error);
    return NextResponse.json({
      isAuthenticated: false,
    });
  }
}
