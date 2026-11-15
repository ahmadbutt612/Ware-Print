"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { getOrigin } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { safeNextPath } from "@/lib/utils";
import { CHECK_FIELDS, fail, fieldFail, str, zodFieldErrors } from "@/lib/validation";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Enter your full name.").max(100, "Name is too long."),
  companyName: z.string().min(2, "Enter your company or business name.").max(120, "Company name is too long."),
  email: z.email("Enter a valid email address.").max(200),
  phone: z.string().min(7, "Enter your mobile number.").max(30),
  password: z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer."),
});

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    fullName: str(formData.get("fullName")),
    companyName: str(formData.get("companyName")),
    email: str(formData.get("email")).toLowerCase(),
    phone: str(formData.get("phone")),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return fail(CHECK_FIELDS, zodFieldErrors(parsed.error));
  const d = parsed.data;

  if (String(formData.get("confirm") ?? "") !== d.password) return fieldFail("confirm", "The two passwords do not match.");
  const phone = normalizePhone(d.phone);
  if (!phone) return fieldFail("phone", "Enter a valid mobile number, e.g. 0300 1234567.");
  if (formData.get("terms") !== "on") return fieldFail("terms", "Please accept the terms of use to continue.");

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
      data: { full_name: d.fullName, company_name: d.companyName, phone },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return fieldFail("email", "An account with this email already exists. Sign in instead.");
    }
    if (error.code === "weak_password") return fieldFail("password", "Choose a stronger password.");
    if (error.status === 429 || error.code?.startsWith("over_")) {
      return fail("Too many sign-ups were attempted recently. Please wait a few minutes and try again.");
    }
    console.error("[signUp]", error.code, error.message);
    return fail("Your account could not be created. Please try again.");
  }

  redirect(`/check-email?email=${encodeURIComponent(d.email)}`);
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = str(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return fail("Enter your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return fail(
        "Please confirm your email address first — open the link we emailed you when you signed up. You can ask for a new link on the “Check your email” page.",
      );
    }
    if (error.status === 429 || error.code?.startsWith("over_")) {
      return fail("Too many attempts. Please wait a few minutes and try again.");
    }
    return fail("The email or password is incorrect.");
  }

  redirect(safeNextPath(str(formData.get("next")), "/dashboard"));
}

export async function resendConfirmation(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = str(formData.get("email")).toLowerCase();
  if (!z.email().safeParse(email).success) return fieldFail("email", "Enter a valid email address.");
  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/dashboard` },
  });
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) {
    return fail("A link was sent very recently. Please wait a minute before asking for another.");
  }
  return { ok: true, message: "If this email has an unconfirmed account, a new confirmation link is on its way." };
}

export async function requestPasswordReset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = str(formData.get("email")).toLowerCase();
  if (!z.email().safeParse(email).success) return fieldFail("email", "Enter a valid email address.");
  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) {
    return fail("A reset link was sent very recently. Please wait a minute before asking for another.");
  }
  return { ok: true, message: "If an account exists for this email, a password reset link is on its way. Check your inbox and spam folder." };
}

export async function updatePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return fieldFail("password", "Use at least 8 characters.");
  if (String(formData.get("confirm") ?? "") !== password) return fieldFail("confirm", "The two passwords do not match.");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("Your reset link has expired. Please request a new one.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return fieldFail("password", "Choose a password different from your old one.");
    return fail("Your password could not be changed. Please request a new reset link.");
  }
  redirect("/dashboard?password=updated");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
