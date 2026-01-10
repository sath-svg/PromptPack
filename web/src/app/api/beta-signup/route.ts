import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Resend } from "resend";
import { buildLiveEmailHtml, LIVE_EMAIL_SUBJECT } from "@/lib/email/live-email";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const FROM_EMAIL = "PromptPack Support <support@pmtpk.com>";
const REPLY_TO = "support@pmtpk.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // Store in Convex database
    const result = await convex.mutation(api.betaSignups.create, { email });

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY for beta signup email.");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const html = buildLiveEmailHtml();

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: LIVE_EMAIL_SUBJECT,
      html,
      replyTo: REPLY_TO,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...result, emailSent: true });
  } catch (error) {
    console.error("Beta signup error:", error);
    return NextResponse.json(
      { error: "Failed to sign up" },
      { status: 500 }
    );
  }
}
