import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  // Add CORS headers for extension
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "https://pmtpk.com",
  ];

  // Allow chrome-extension:// origins for browser extensions
  const isExtension = origin?.startsWith("chrome-extension://") ||
                      origin?.startsWith("moz-extension://") ||
                      origin?.startsWith("safari-web-extension://");

  const corsHeaders = {
    "Access-Control-Allow-Origin": isExtension || allowedOrigins.includes(origin || "")
      ? origin || "*"
      : allowedOrigins[0],
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { isAuthenticated: false },
        { headers: corsHeaders }
      );
    }

    // Fetch user details if authenticated
    const user = await currentUser();

    return NextResponse.json(
      {
        isAuthenticated: true,
        user: user
          ? {
              id: user.id,
              email: user.emailAddresses[0]?.emailAddress || "",
              name: user.firstName || user.username || undefined,
            }
          : undefined,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Auth status check error:", error);
    return NextResponse.json(
      { isAuthenticated: false },
      { headers: corsHeaders }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const isExtension = origin?.startsWith("chrome-extension://") ||
                      origin?.startsWith("moz-extension://") ||
                      origin?.startsWith("safari-web-extension://");

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": isExtension ? origin || "*" : "https://pmtpk.com",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
