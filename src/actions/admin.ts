"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getAccount } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { COMMISSION_STATUS_LABELS, listingPath, listingRef } from "@/lib/format";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { getOrigin } from "@/lib/request";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, CommissionStatus, ListingStatus } from "@/lib/types";
import { fail, fieldFail, str } from "@/lib/validation";

async function adminOnly() {
  const account = await getAccount();
  return account?.isAdmin ? account : null;
}

type Decision = "approve" | "changes" | "reject";

const ALLOWED_FROM: Record<Decision, ListingStatus[]> = {
  approve: ["pending", "changes_requested"],
  changes: ["pending", "published"],
  reject: ["pending", "changes_requested", "published"],
};

export async function reviewListing(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await adminOnly();
  if (!account) return fail("Only Ware Print admins can do this.");

  const id = str(formData.get("id"));
  const decision = str(formData.get("decision")) as Decision;
  const note = str(formData.get("note")).slice(0, 2000);
  if (!(decision in ALLOWED_FROM)) return fail("Choose approve, request changes or reject.");
  if ((decision === "changes" || decision === "reject") && note.length < 5) {
    return fieldFail("note", "Write a short note for the seller explaining what to change or why it was rejected.");
  }

  const admin = createAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("id, ref, slug, title, status, seller_id, published_at")
    .eq("id", id)
    .maybeSingle();
  if (!listing) return fail("Listing not found.");
  if (!ALLOWED_FROM[decision].includes(listing.status)) {
    return fail(`This listing is “${listing.status}”, so it cannot be ${decision === "approve" ? "approved" : "changed"} now. Reload the page.`);
  }

  const now = new Date().toISOString();
  const status: ListingStatus = decision === "approve" ? "published" : decision === "changes" ? "changes_requested" : "rejected";
  const { error } = await admin
    .from("listings")
    .update({
      status,
      reviewed_at: now,
      reviewed_by: account.user.id,
      review_note: note || null,
      ...(decision === "approve" ? { published_at: listing.published_at ?? now } : {}),
    })
    .eq("id", id)
    .eq("status", listing.status);
  if (error) {
    console.error("[reviewListing]", error.message);
    return fail("The decision could not be saved. Please try again.");
  }

  const action =
    decision === "approve"
      ? "approved"
      : decision === "reject"
        ? "rejected"
        : listing.status === "published"
          ? "unpublished"
          : "changes_requested";
  await admin.from("listing_events").insert({ listing_id: id, actor_id: account.user.id, action, note: note || null });

  const [{ data: seller }, origin] = await Promise.all([
    admin.from("profiles").select("email, contact_email, full_name").eq("id", listing.seller_id).single(),
    getOrigin(),
  ]);
  const ref = listingRef(listing.ref);
  if (seller) {
    const to = seller.contact_email || seller.email;
    const greeting = seller.full_name ? `Hello ${seller.full_name.split(" ")[0]}, ` : "";
    const content =
      decision === "approve"
        ? {
            subject: `Your listing ${ref} is live on Ware Print`,
            heading: "Your listing is live",
            intro: `${greeting}“${listing.title}” passed review. Buyers can now see it and send you inquiries.`,
            rows: [["Reference", ref] as [string, string]],
            quote: note || undefined,
            cta: { label: "View your listing", url: `${origin}${listingPath(listing.ref, listing.slug)}` },
            footnote: "Inquiries are sent to your email and by SMS to your verified number.",
          }
        : decision === "changes"
          ? {
              subject: `Changes needed for ${ref}`,
              heading: action === "unpublished" ? "Your listing was taken down for changes" : "Ware Print asked for changes",
              intro: `${greeting}please update “${listing.title}” and submit it again. Our note:`,
              quote: note,
              cta: { label: "Edit your listing", url: `${origin}/dashboard/listings/${id}` },
            }
          : {
              subject: `Your listing ${ref} was not approved`,
              heading: "Your listing was not approved",
              intro: `${greeting}“${listing.title}” cannot be published on Ware Print. Reason:`,
              quote: note,
              cta: { label: "Open your dashboard", url: `${origin}/dashboard/listings` },
              footnote: "If you think this is a mistake, reply to this email.",
            };
    after(async () => {
      await sendEmail(to, content);
    });
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/machines");
  revalidatePath("/");
  redirect(`/admin/listings?done=${decision}&ref=${listing.ref}`);
}

export async function setSellerSuspended(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await adminOnly();
  if (!account) return fail("Only Ware Print admins can do this.");
  const id = str(formData.get("id"));
  const suspend = str(formData.get("suspend")) === "true";
  if (id === account.user.id && suspend) return fail("You cannot suspend your own account.");

  const { error } = await createAdminClient().from("companies").update({ is_suspended: suspend }).eq("id", id);
  if (error) return fail("Could not update the seller.");
  revalidatePath("/admin", "layout");
  revalidatePath("/machines");
  return {
    ok: true,
    message: suspend ? "Seller suspended. Their listings are hidden from buyers." : "Seller reactivated. Their published listings are visible again.",
  };
}

export async function verifySellerPhone(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await adminOnly();
  if (!account) return fail("Only Ware Print admins can do this.");
  const id = str(formData.get("id"));
  const phone = normalizePhone(str(formData.get("phone")));
  if (!phone) return fieldFail("phone", "Enter a valid number, e.g. 0300 1234567.");

  const admin = createAdminClient();
  const { data: taken } = await admin.from("profiles").select("id").eq("phone", phone).neq("id", id).maybeSingle();
  if (taken) return fieldFail("phone", "This number is verified on another account.");
  const now = new Date().toISOString();
  const { error } = await admin
    .from("profiles")
    .update({ phone, phone_verified_at: now, phone_pending: null })
    .eq("id", id);
  if (error) return fail("Could not save the number.");
  await admin.from("companies").update({ verified_at: now }).eq("id", id);
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${formatPhone(phone)} marked as verified.` };
}

const COMMISSION_STATUSES: CommissionStatus[] = ["due", "invoiced", "paid", "waived", "not_applicable"];

export async function updateSale(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await adminOnly();
  if (!account) return fail("Only Ware Print admins can do this.");
  const id = str(formData.get("id"));
  const status = str(formData.get("status")) as CommissionStatus;
  if (!COMMISSION_STATUSES.includes(status)) return fail("Choose a commission status.");
  const adminNote = str(formData.get("adminNote")).slice(0, 1000);

  const { error } = await createAdminClient()
    .from("sales")
    .update({ commission_status: status, admin_note: adminNote || null })
    .eq("id", id);
  if (error) return fail("Could not update the sale.");
  revalidatePath("/admin/sales");
  return { ok: true, message: `Saved: ${COMMISSION_STATUS_LABELS[status]}.` };
}
