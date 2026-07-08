import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, phone, city, property_type, notes } = body;

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "שם וטלפון הם שדות חובה" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("seller_leads").insert({
    name: name.trim(),
    phone: phone.trim(),
    city: city?.trim() || null,
    property_type: property_type || null,
    notes: notes?.trim() || null,
  });

  if (error) {
    console.error("[seller-leads] DB error:", error);
    return NextResponse.json({ error: "שגיאה בשמירת הפרטים" }, { status: 500 });
  }

  // Send email via Gmail (graceful skip if env missing)
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "amir@mango-realty.com",
          pass: gmailPass,
        },
      });

      await transporter.sendMail({
        from: '"מנגו נדל"ן" <amir@mango-realty.com>',
        to: "amir@mango-realty.com",
        subject: `🏠 ליד מוכר חדש: ${name}`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:#1C1C1E;padding:24px 32px;">
              <h1 style="color:#D4A853;margin:0;font-size:20px;">🏠 ליד מוכר חדש</h1>
              <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:13px;">מנגו נדל"ן — מדור מוכרים</p>
            </div>
            <div style="padding:28px 32px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#6b7280;font-size:13px;width:100px;">שם</td>
                  <td style="padding:8px 0;font-weight:700;color:#111827;font-size:15px;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#6b7280;font-size:13px;">טלפון</td>
                  <td style="padding:8px 0;font-weight:700;color:#111827;font-size:15px;">
                    <a href="tel:${phone}" style="color:#D4A853;text-decoration:none;">${phone}</a>
                  </td>
                </tr>
                ${city ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">עיר</td><td style="padding:8px 0;color:#374151;font-size:14px;">${city}</td></tr>` : ""}
                ${property_type ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">סוג נכס</td><td style="padding:8px 0;color:#374151;font-size:14px;">${property_type}</td></tr>` : ""}
                ${notes ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">הערות</td><td style="padding:8px 0;color:#374151;font-size:14px;">${notes}</td></tr>` : ""}
              </table>
            </div>
            <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <a href="https://mango-realty-com.vercel.app/admin" style="color:#D4A853;font-size:12px;text-decoration:none;">
                פתח בפאנל הניהול ←
              </a>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error("[seller-leads] Email send failed:", e);
    }
  }

  // Send WhatsApp via Twilio (graceful skip if env missing)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromWa     = process.env.TWILIO_WHATSAPP_FROM;

  if (accountSid && authToken && fromWa) {
    try {
      const message = [
        "🏠 ליד מוכר חדש!",
        `שם: ${name}`,
        `טלפון: ${phone}`,
        city          ? `עיר: ${city}`             : null,
        property_type ? `סוג נכס: ${property_type}` : null,
        notes         ? `הערות: ${notes}`           : null,
      ].filter(Boolean).join("\n");

      const params = new URLSearchParams({
        From: fromWa,
        To:   "whatsapp:+972525403338",
        Body: message,
      });

      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          },
          body: params.toString(),
        },
      );
    } catch (e) {
      console.error("[seller-leads] WhatsApp send failed:", e);
    }
  }

  return NextResponse.json({ success: true });
}
