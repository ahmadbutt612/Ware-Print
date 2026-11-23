import "server-only";
import { isProduction } from "@/lib/env";
import { formatPhone } from "@/lib/phone";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import { isWhatsAppConfigured, sendWhatsAppCode, sendWhatsAppInquiryAlert } from "@/lib/whatsapp";

// Phone messages go by WhatsApp when it is set up, otherwise by SMS (Twilio).
// With neither, codes are shown on screen on your own computer only.

export type Channel = "whatsapp" | "sms" | "test";

export function codeChannel(): Channel | null {
  if (isWhatsAppConfigured()) return "whatsapp";
  if (isSmsConfigured()) return "sms";
  return isProduction ? null : "test";
}

export async function sendVerificationCode(
  phone: string,
  code: string,
  minutes: number,
): Promise<{ ok: boolean; channel: Channel | null; error?: string }> {
  const channel = codeChannel();
  if (channel === "whatsapp") {
    const res = await sendWhatsAppCode(phone, code);
    if (res.ok) return { ok: true, channel };
    if (res.error === "not_on_whatsapp") {
      return { ok: false, channel, error: "This number does not use WhatsApp. Enter a number that has WhatsApp." };
    }
    return { ok: false, channel, error: "The WhatsApp message could not be sent. Check the number and try again." };
  }
  if (channel === "sms") {
    const res = await sendSms(phone, `Your Ware Print verification code is ${code}. It expires in ${minutes} minutes. Do not share it.`);
    return res.ok ? { ok: true, channel } : { ok: false, channel, error: "The text message could not be sent. Check the number and try again." };
  }
  if (channel === "test") return { ok: true, channel };
  return { ok: false, channel: null, error: "Phone verification is not switched on yet. Please contact Ware Print to verify your number by phone." };
}

export function inquiryAlertsEnabled(): boolean {
  const flag = (process.env.SEND_INQUIRY_ALERTS ?? process.env.SEND_INQUIRY_SMS ?? "true").toLowerCase();
  return flag !== "false";
}

/** Short "you have a new inquiry" alert to the seller's verified phone. */
export async function sendInquiryAlert(
  phone: string,
  values: { ref: string; title: string; buyer: string; buyerPhone: string },
): Promise<{ ok: boolean }> {
  if (!inquiryAlertsEnabled()) return { ok: false };
  const listing = `${values.ref} ${values.title}`;
  const viaWhatsApp = await sendWhatsAppInquiryAlert(phone, {
    listing,
    buyer: values.buyer,
    buyerPhone: formatPhone(values.buyerPhone),
  });
  if (viaWhatsApp.ok) return { ok: true };
  if (!viaWhatsApp.skipped || !isSmsConfigured()) return { ok: false };
  const sms = await sendSms(
    phone,
    `Ware Print: new inquiry for ${values.ref} from ${values.buyer}, ${formatPhone(values.buyerPhone)}. Full message sent to your email.`,
  );
  return { ok: sms.ok };
}
