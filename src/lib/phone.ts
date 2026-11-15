/**
 * Turn what people type into an international (E.164) number.
 * Pakistani formats are understood without the country code:
 *   0300 1234567 → +923001234567,  042 3576 1234 → +924235761234
 * Other countries must start with + or 00.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim().replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  else if (/^0\d{9,10}$/.test(s)) s = `+92${s.slice(1)}`;
  else if (/^3\d{9}$/.test(s)) s = `+92${s}`;
  else if (/^92\d{9,10}$/.test(s)) s = `+${s}`;
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  return s;
}

export function isPakistaniMobile(e164: string): boolean {
  return /^\+923\d{9}$/.test(e164);
}

/** +923001234567 → "+92 300 1234567" */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const pk = /^\+92(3\d{2})(\d{7})$/.exec(e164);
  if (pk) return `+92 ${pk[1]} ${pk[2]}`;
  return e164;
}

export function whatsappLink(e164: string, text?: string): string {
  const digits = e164.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Hide most digits: +92 300 •••4567 */
export function maskPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const last4 = e164.slice(-4);
  const pk = /^\+92(3\d{2})\d{7}$/.exec(e164);
  if (pk) return `+92 ${pk[1]} •••${last4}`;
  return `${e164.slice(0, 4)} ••• ${last4}`;
}
