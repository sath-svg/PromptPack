import { auth } from "../../../../../lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "https://skillset.so",
    "https://www.skillset.so",
    "https://pmtpk.com",
    "https://www.pmtpk.com",
  ];

  const isExtension =
    origin?.startsWith("chrome-extension://") ||
    origin?.startsWith("moz-extension://") ||
    origin?.startsWith("safari-web-extension://");

  const corsHeaders = {
    "Access-Control-Allow-Origin":
      isExtension || allowedOrigins.includes(origin || "")
        ? origin || "*"
        : allowedOrigins[0],
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { isAuthenticated: false },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        isAuthenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || undefined,
        },
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

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const isExtension =
    origin?.startsWith("chrome-extension://") ||
    origin?.startsWith("moz-extension://") ||
    origin?.startsWith("safari-web-extension://");

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": isExtension
        ? origin || "*"
        : "https://skillset.so",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
