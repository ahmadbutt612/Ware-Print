import "server-only";
import { isProduction } from "@/lib/env";
import { site } from "@/lib/site";
import type { SendResult } from "@/lib/sms";
import { escapeHtml } from "@/lib/utils";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes("@"));
}

export interface EmailContent {
  subject: string;
  heading: string;
  intro?: string;
  rows?: [string, string][];
  /** Free text from a user (shown as a quoted block, line breaks kept) */
  quote?: string;
  cta?: { label: string; url: string };
  footnote?: string;
}

const C = { ink: "#151515", ink2: "#45453f", ink3: "#6f6f68", line: "#d6d6d1", paper2: "#f7f7f4", red: "#c8102e" };

function renderHtml(c: EmailContent): string {
  const rows = (c.rows ?? [])
    .filter(([, v]) => v)
    .map(
      ([k, v]) => `<tr>
        <th align="left" valign="top" style="padding:9px 12px;width:36%;background:${C.paper2};border-bottom:1px solid ${C.line};font-size:13px;font-weight:600;color:${C.ink2}">${escapeHtml(k)}</th>
        <td valign="top" style="padding:9px 12px;border-bottom:1px solid ${C.line};font-size:14px;color:${C.ink}">${escapeHtml(v)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(c.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.paper2};font-family:Arial,Helvetica,sans-serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper2};padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${C.line}">
  <tr><td style="background:${C.red};height:4px;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:18px 28px;border-bottom:1px solid ${C.line};font-size:14px;font-weight:bold;letter-spacing:3px;color:${C.ink}">WARE&nbsp;PRINT</td></tr>
  <tr><td style="padding:28px">
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:${C.ink}">${escapeHtml(c.heading)}</h1>
    ${c.intro ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${C.ink2}">${escapeHtml(c.intro)}</p>` : ""}
    ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-bottom:0;margin:0 0 20px">${rows}</table>` : ""}
    ${c.quote ? `<div style="margin:0 0 20px;padding:12px 16px;border-left:3px solid ${C.red};background:${C.paper2};font-size:14px;line-height:1.55;white-space:pre-wrap;color:${C.ink}">${escapeHtml(c.quote)}</div>` : ""}
    ${c.cta ? `<a href="${escapeHtml(c.cta.url)}" style="display:inline-block;background:${C.red};color:#ffffff;padding:12px 20px;font-size:14px;font-weight:bold;text-decoration:none">${escapeHtml(c.cta.label)}</a>` : ""}
  </td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid ${C.line};font-size:12px;line-height:1.5;color:${C.ink3}">
    ${c.footnote ? `${escapeHtml(c.footnote)}<br>` : ""}Ware Print · Printing &amp; packaging machinery marketplace · <a href="${escapeHtml(site.url)}" style="color:${C.ink3}">${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function renderText(c: EmailContent): string {
  const lines = [c.heading, ""];
  if (c.intro) lines.push(c.intro, "");
  for (const [k, v] of c.rows ?? []) if (v) lines.push(`${k}: ${v}`);
  if (c.rows?.length) lines.push("");
  if (c.quote) lines.push(c.quote, "");
  if (c.cta) lines.push(`${c.cta.label}: ${c.cta.url}`, "");
  if (c.footnote) lines.push(c.footnote, "");
  lines.push(`Ware Print — ${site.url}`);
  return lines.join("\n");
}

/** Sends an email through Resend. Without a Resend key it only logs (in development). */
export async function sendEmail(
  to: string | string[],
  content: EmailContent,
  options: { replyTo?: string } = {},
): Promise<SendResult> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return { ok: false, skipped: true };

  if (!isEmailConfigured()) {
    if (!isProduction) {
      console.info(`[email not configured] to ${recipients.join(", ")}: ${content.subject}\n${renderText(content)}`);
    }
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Ware Print <onboarding@resend.dev>",
        to: recipients,
        subject: content.subject,
        html: renderHtml(content),
        text: renderText(content),
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
      return { ok: false, error: `Email provider returned ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[email] request failed", error);
    return { ok: false, error: "Could not reach the email provider" };
  }
}
