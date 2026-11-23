import "server-only";
import { isProduction } from "@/lib/env";
import type { SendResult } from "@/lib/sms";

// WhatsApp Cloud API (Meta). Business-initiated messages must use templates
// that Meta has approved in WhatsApp Manager. See SETUP-GUIDE.md, part C2.

const API_VERSION = (process.env.WHATSAPP_API_VERSION || "v23.0").trim();
const LANGUAGE = (process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US").trim();

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && otpTemplate());
}

function otpTemplate(): string {
  return (process.env.WHATSAPP_OTP_TEMPLATE || "").trim();
}

export function inquiryTemplate(): string {
  return (process.env.WHATSAPP_INQUIRY_TEMPLATE || "").trim();
}

/** Template variables may not contain new lines, tabs or long runs of spaces. */
function clean(value: string, max = 60): string {
  return value.replace(/[\n\r\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max) || "-";
}

async function sendTemplate(to: string, template: string, components: unknown[]): Promise<SendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/\D/g, ""),
        type: "template",
        template: { name: template, language: { code: LANGUAGE }, components },
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[whatsapp] ${res.status}: ${detail}`);
      // 131026: number is not on WhatsApp / cannot receive messages.
      if (detail.includes("131026")) return { ok: false, error: "not_on_whatsapp" };
      return { ok: false, error: `WhatsApp returned ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[whatsapp] request failed", error);
    return { ok: false, error: "Could not reach WhatsApp" };
  }
}

/** Sends a 6-digit code using an approved "Authentication" template with a copy-code button. */
export async function sendWhatsAppCode(to: string, code: string): Promise<SendResult> {
  if (!isWhatsAppConfigured()) {
    if (!isProduction) console.info(`[whatsapp not configured] code for ${to}: ${code}`);
    return { ok: false, skipped: true };
  }
  return sendTemplate(to, otpTemplate(), [
    { type: "body", parameters: [{ type: "text", text: code }] },
    { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
  ]);
}

/**
 * Tells a seller about a new inquiry, using an approved "Utility" template whose
 * body has three variables: {{1}} listing, {{2}} buyer name, {{3}} buyer phone.
 */
export async function sendWhatsAppInquiryAlert(
  to: string,
  values: { listing: string; buyer: string; buyerPhone: string },
): Promise<SendResult> {
  const template = inquiryTemplate();
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID || !template) {
    return { ok: false, skipped: true };
  }
  return sendTemplate(to, template, [
    {
      type: "body",
      parameters: [
        { type: "text", text: clean(values.listing, 80) },
        { type: "text", text: clean(values.buyer) },
        { type: "text", text: clean(values.buyerPhone, 30) },
      ],
    },
  ]);
}
