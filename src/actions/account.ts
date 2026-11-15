"use server";

import { randomInt, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AGREEMENT_VERSION, agreementText } from "@/lib/agreement";
import { getAccount } from "@/lib/auth";
import { isProduction } from "@/lib/env";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { getRequestMeta, hmac } from "@/lib/request";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";
import { CHECK_FIELDS, fail, fieldFail, str, zodFieldErrors } from "@/lib/validation";

const SIGNED_OUT = "Your session has ended. Please sign in again.";

// ---------------------------------------------------------------- company

const companySchema = z.object({
  fullName: z.string().min(2, "Enter the contact person's full name.").max(100),
  companyName: z.string().min(2, "Enter your company name.").max(120),
  city: z.string().min(2, "Enter your city.").max(80),
  country: z.string().min(2, "Enter your country.").max(80),
  address: z.string().max(300, "Address is too long."),
  website: z.string().max(200, "Website address is too long."),
  about: z.string().max(1500, "Please keep this under 1,500 characters."),
  contactEmail: z.union([z.literal(""), z.email("Enter a valid email address.").max(200)]),
});

function normalizeWebsite(value: string): string | null | false {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString().replace(/\/$/, "") : false;
  } catch {
    return false;
  }
}

export async function saveCompany(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await getAccount();
  if (!account) return fail(SIGNED_OUT);

  const parsed = companySchema.safeParse({
    fullName: str(formData.get("fullName")),
    companyName: str(formData.get("companyName")),
    city: str(formData.get("city")),
    country: str(formData.get("country")),
    address: str(formData.get("address")),
    website: str(formData.get("website")),
    about: str(formData.get("about")),
    contactEmail: str(formData.get("contactEmail")).toLowerCase(),
  });
  if (!parsed.success) return fail(CHECK_FIELDS, zodFieldErrors(parsed.error));
  const d = parsed.data;
  const website = normalizeWebsite(d.website);
  if (website === false) return fieldFail("website", "Enter a website like www.yourcompany.com, or leave it empty.");

  const admin = createAdminClient();
  const [p, c] = await Promise.all([
    admin
      .from("profiles")
      .update({ full_name: d.fullName, contact_email: d.contactEmail || account.user.email, address: d.address || null })
      .eq("id", account.user.id),
    admin
      .from("companies")
      .update({ name: d.companyName, city: d.city, country: d.country, website, about: d.about || null })
      .eq("id", account.user.id),
  ]);
  if (p.error || c.error) {
    console.error("[saveCompany]", p.error?.message, c.error?.message);
    return fail("Your details could not be saved. Please try again.");
  }

  revalidatePath("/dashboard", "layout");
  if (!account.onboarding.companyComplete) redirect("/dashboard?saved=company");
  return { ok: true, message: "Company details saved." };
}

// ------------------------------------------------------------ phone codes

const OTP_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export async function sendPhoneCode(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await getAccount();
  if (!account) return fail(SIGNED_OUT);
  const userId = account.user.id;

  const phone = normalizePhone(str(formData.get("phone")));
  if (!phone) return fieldFail("phone", "Enter a valid mobile number, e.g. 0300 1234567 or +971 50 123 4567.");
  if (account.profile.phone === phone && account.profile.phone_verified_at) {
    return fieldFail("phone", "This number is already verified on your account.");
  }

  const admin = createAdminClient();
  const { data: taken } = await admin.from("profiles").select("id").eq("phone", phone).neq("id", userId).maybeSingle();
  if (taken) return fieldFail("phone", "This number is already verified on another Ware Print account.");

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const quarterAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: recent } = await admin.from("phone_otps").select("created_at").eq("user_id", userId).gte("created_at", dayAgo);
  const lastQuarter = (recent ?? []).filter((r) => r.created_at >= quarterAgo).length;
  if (lastQuarter >= 3 || (recent?.length ?? 0) >= 8) {
    return fail("Too many codes were requested. Please wait 15 minutes, or contact Ware Print to verify your number.");
  }

  if (!isSmsConfigured() && isProduction) {
    return fail("Text messages are not switched on yet. Please contact Ware Print to verify your number by phone.");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await admin.from("phone_otps").insert({
    user_id: userId,
    phone,
    code_hash: hmac(`otp:${userId}:${phone}:${code}`),
    expires_at: new Date(Date.now() + OTP_MINUTES * 60 * 1000).toISOString(),
  });
  if (error) {
    console.error("[sendPhoneCode]", error.message);
    return fail("The code could not be created. Please try again.");
  }

  const sms = await sendSms(phone, `Your Ware Print verification code is ${code}. It expires in ${OTP_MINUTES} minutes. Do not share it.`);
  if (!sms.ok && !sms.skipped) return fail("The text message could not be sent. Check the number and try again.");
  await admin.from("profiles").update({ phone_pending: phone }).eq("id", userId);

  revalidatePath("/dashboard/phone");
  return {
    ok: true,
    message: sms.skipped
      ? `Test mode — SMS is not set up on this computer, so here is your code: ${code}`
      : `We sent a 6-digit code to ${formatPhone(phone)}.`,
  };
}

export async function verifyPhoneCode(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await getAccount();
  if (!account) return fail(SIGNED_OUT);
  const userId = account.user.id;

  const code = str(formData.get("code")).replace(/\D/g, "");
  if (code.length !== 6) return fieldFail("code", "Enter the 6-digit code from the text message.");

  const admin = createAdminClient();
  const { data: otp } = await admin
    .from("phone_otps")
    .select("id, phone, code_hash, attempts")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!otp) return fail("This code has expired. Send a new code and try again.");
  if (otp.attempts >= MAX_ATTEMPTS) return fail("Too many wrong attempts. Send a new code and try again.");

  const expected = Buffer.from(hmac(`otp:${userId}:${otp.phone}:${code}`));
  const stored = Buffer.from(otp.code_hash);
  if (expected.length !== stored.length || !timingSafeEqual(expected, stored)) {
    await admin.from("phone_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    const left = MAX_ATTEMPTS - otp.attempts - 1;
    return fieldFail("code", left > 0 ? `That code is not correct. ${left} attempt${left === 1 ? "" : "s"} left.` : "That code is not correct. Send a new code.");
  }

  const now = new Date().toISOString();
  await admin.from("phone_otps").update({ consumed_at: now }).eq("id", otp.id);
  const { error } = await admin
    .from("profiles")
    .update({ phone: otp.phone, phone_verified_at: now, phone_pending: null })
    .eq("id", userId);
  if (error) {
    if (error.code === "23505") return fail("This number has just been verified on another account.");
    console.error("[verifyPhoneCode]", error.message);
    return fail("Your number could not be saved. Please try again.");
  }
  await admin.from("companies").update({ verified_at: now }).eq("id", userId);

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard?saved=phone");
}

// -------------------------------------------------------------- agreement

const squash = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export async function signAgreement(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await getAccount();
  if (!account) return fail(SIGNED_OUT);
  if (!account.onboarding.companyComplete) return fail("Fill in your company details before signing.");

  const signedName = str(formData.get("signedName")).replace(/\s+/g, " ");
  if (squash(signedName) !== squash(account.profile.full_name)) {
    return fieldFail("signedName", `Type your full name exactly as on your account: ${account.profile.full_name}`);
  }
  if (formData.get("accept") !== "on") return fieldFail("accept", "Tick the box to confirm you agree.");

  const { ip, userAgent } = await getRequestMeta();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("seller_agreements").insert({
    seller_id: account.user.id,
    version: AGREEMENT_VERSION,
    agreement_text: agreementText(signedName, account.company.name),
    signed_name: signedName,
    company_name: account.company.name,
    ip_address: ip,
    user_agent: userAgent,
    signed_at: now,
  });
  if (error) {
    console.error("[signAgreement]", error.message);
    return fail("Your signature could not be saved. Please try again.");
  }
  await admin
    .from("profiles")
    .update({ agreement_signed_at: now, agreement_version: AGREEMENT_VERSION })
    .eq("id", account.user.id);

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard?saved=agreement");
}
