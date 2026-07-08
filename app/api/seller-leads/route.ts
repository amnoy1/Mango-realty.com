import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

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
        city          ? `עיר: ${city}`                 : null,
        property_type ? `סוג נכס: ${property_type}`     : null,
        notes         ? `הערות: ${notes}`               : null,
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
