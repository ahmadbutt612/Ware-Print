import "server-only";
import { isProduction } from "@/lib/env";

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID),
  );
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/** Sends an SMS through Twilio. Without Twilio settings it only logs (in development). */
export async function sendSms(to: string, body: string): Promise<SendResult> {
  if (!isSmsConfigured()) {
    if (!isProduction) console.info(`[sms not configured] to ${to}: ${body}`);
    return { ok: false, skipped: true };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const params = new URLSearchParams({ To: to, Body: body });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    params.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    params.set("From", process.env.TWILIO_FROM_NUMBER!);
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[sms] Twilio error ${res.status}: ${detail}`);
      return { ok: false, error: `SMS provider returned ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[sms] request failed", error);
    return { ok: false, error: "Could not reach the SMS provider" };
  }
}
