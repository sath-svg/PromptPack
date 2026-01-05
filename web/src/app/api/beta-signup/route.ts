import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;

    if (!email || !email.includes("@")) {
      return NextResponse.redirect(new URL("/?beta=invalid", req.url));
    }

    // Store in Convex database
    await convex.mutation(api.betaSignups.create, { email });

    // Redirect back to homepage with success message
    return NextResponse.redirect(new URL("/?beta=success", req.url));
  } catch (error) {
    console.error("Beta signup error:", error);
    return NextResponse.redirect(new URL("/?beta=error", req.url));
  }
}
