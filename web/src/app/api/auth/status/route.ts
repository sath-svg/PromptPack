import { auth, currentUser } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // CORS for landing page + Tauri desktop app (browser extensions retired)
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "https://skillset.so",
    "https://www.skillset.so",
    "https://pmtpk.com",
    "https://www.pmtpk.com",
  ];

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin || "")
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
              name: user.fullName || undefined,
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
  const allowedOrigins = [
    "https://skillset.so",
    "https://www.skillset.so",
    "https://pmtpk.com",
    "https://www.pmtpk.com",
  ];
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin || "")
        ? origin || "*"
        : allowedOrigins[0],
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
