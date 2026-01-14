import { NextResponse } from "next/server";
import { Resend } from "resend";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "sathvik.work@gmail.com";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const attachments = formData.getAll("attachments") as File[];

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Convert file attachments to base64 for Resend
    const emailAttachments = await Promise.all(
      attachments.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return {
          filename: file.name,
          content: Buffer.from(buffer).toString("base64"),
        };
      })
    );

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "PromptPack Support <onboarding@resend.dev>",
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Support] ${subject || "New Request"} - from ${email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Support Request</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>From:</strong></td>
              <td style="padding: 8px 0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Subject:</strong></td>
              <td style="padding: 8px 0;">${subject || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Attachments:</strong></td>
              <td style="padding: 8px 0;">${attachments.length} file(s)</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="color: #999; font-size: 12px;">
            Sent from PromptPack Support Widget at ${new Date().toISOString()}
          </p>
        </div>
      `,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      message: "Support request received. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("Support request error:", error);
    return NextResponse.json(
      { error: "Failed to send support request" },
      { status: 500 }
    );
  }
}
