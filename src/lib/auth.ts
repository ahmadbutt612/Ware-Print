import "server-only";
import type { User } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { AGREEMENT_VERSION } from "@/lib/agreement";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Company, Profile } from "@/lib/types";

export interface Onboarding {
  emailVerified: boolean;
  phoneVerified: boolean;
  companyComplete: boolean;
  agreementSigned: boolean;
  suspended: boolean;
  /** All steps done and not suspended: may create and submit listings */
  complete: boolean;
}

export interface Account {
  user: User;
  profile: Profile;
  company: Company;
  onboarding: Onboarding;
  isAdmin: boolean;
}

/** The signed-in user, verified with Supabase Auth. Cached per request. */
export const getUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export function onboardingOf(user: User, profile: Profile, company: Company): Onboarding {
  const emailVerified = Boolean(user.email_confirmed_at);
  const phoneVerified = Boolean(profile.phone && profile.phone_verified_at);
  const companyComplete = Boolean(
    company.name.trim() && company.city.trim() && company.country.trim() && profile.full_name.trim(),
  );
  const agreementSigned = Boolean(profile.agreement_signed_at && profile.agreement_version === AGREEMENT_VERSION);
  const suspended = company.is_suspended;
  return {
    emailVerified,
    phoneVerified,
    companyComplete,
    agreementSigned,
    suspended,
    complete: emailVerified && phoneVerified && companyComplete && agreementSigned && !suspended,
  };
}

/** The signed-in user with their profile and company. Cached per request. */
export const getAccount = cache(async (): Promise<Account | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const [profileRes, companyRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("companies").select("*").eq("id", user.id).maybeSingle(),
  ]);
  let profile = profileRes.data as Profile | null;
  let company = companyRes.data as Company | null;

  if (!profile || !company) {
    // The account was created before the database was set up: create the rows now.
    const admin = createAdminClient();
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (!profile) {
      await admin.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? "",
          email_confirmed_at: user.email_confirmed_at ?? null,
          full_name: typeof meta.full_name === "string" ? meta.full_name : "",
          contact_email: user.email ?? null,
          phone_pending: typeof meta.phone === "string" ? meta.phone : null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
    }
    if (!company) {
      await admin
        .from("companies")
        .upsert(
          { id: user.id, name: typeof meta.company_name === "string" ? meta.company_name : "" },
          { onConflict: "id", ignoreDuplicates: true },
        );
    }
    const [p, c] = await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).single(),
      admin.from("companies").select("*").eq("id", user.id).single(),
    ]);
    profile = p.data as Profile | null;
    company = c.data as Company | null;
    if (!profile || !company) return null;
  }

  return {
    user,
    profile,
    company,
    onboarding: onboardingOf(user, profile, company),
    isAdmin: profile.role === "admin",
  };
});

/** For pages and actions that need a signed-in user. */
export async function requireAccount(next = "/dashboard"): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(next)}`);
  return account;
}

/** For admin pages and actions. Non-admins get a 404 so the area stays hidden. */
export async function requireAdmin(): Promise<Account> {
  const account = await requireAccount("/admin");
  if (!account.isAdmin) notFound();
  return account;
}
