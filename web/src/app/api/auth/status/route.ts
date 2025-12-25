import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        isAuthenticated: false,
      });
    }

    // Fetch user details if authenticated
    const user = await currentUser();

    return NextResponse.json({
      isAuthenticated: true,
      user: user
        ? {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress || "",
          }
        : undefined,
    });
  } catch (error) {
    console.error("Auth status check error:", error);
    return NextResponse.json({
      isAuthenticated: false,
    });
  }
}
