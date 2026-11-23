"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAccount } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { INQUIRY_TOPICS, listingPath, listingRef } from "@/lib/format";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { getOrigin, getRequestMeta } from "@/lib/request";
import { sendInquiryAlert } from "@/lib/messaging";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, InquiryStatus } from "@/lib/types";
import { CHECK_FIELDS, fail, fieldFail, str, zodFieldErrors } from "@/lib/validation";

export interface InquiryResult extends ActionResult {
  sellerName?: string;
  ref?: string;
  email?: string;
}

const inquirySchema = z.object({
  listingId: z.uuid("This listing could not be found."),
  name: z.string().min(2, "Enter your name.").max(100, "Name is too long."),
  company: z.string().max(120, "Company name is too long."),
  email: z.email("Enter a valid email address.").max(200),
  phone: z.string().min(7, "Enter your phone number.").max(30, "Phone number is too long."),
  city: z.string().max(80),
  country: z.string().max(80),
  message: z.string().max(3000, "Please keep your message under 3,000 characters."),
  topics: z.array(z.string()).max(10),
});

export async function sendInquiry(_prev: InquiryResult, formData: FormData): Promise<InquiryResult> {
  // Spam trap: people never see or fill the "website" field.
  if (str(formData.get("website"))) return { ok: true, sellerName: "the seller" };

  const parsed = inquirySchema.safeParse({
    listingId: str(formData.get("listingId")),
    name: str(formData.get("name")),
    company: str(formData.get("company")),
    email: str(formData.get("email")).toLowerCase(),
    phone: str(formData.get("phone")),
    city: str(formData.get("city")),
    country: str(formData.get("country")),
    message: str(formData.get("message")),
    topics: formData.getAll("topics").map(String),
  });
  if (!parsed.success) return fail(CHECK_FIELDS, zodFieldErrors(parsed.error));
  const d = parsed.data;

  const phone = normalizePhone(d.phone);
  if (!phone) return fieldFail("phone", "Enter a valid number, e.g. 0300 1234567 or +971 50 123 4567.");
  const topics = INQUIRY_TOPICS.filter((t) => d.topics.includes(t.id));
  if (d.message.length < 10 && topics.length === 0) {
    return fieldFail("message", "Write your question, or tick at least one of the topics above.");
  }

  const admin = createAdminClient();
  const { ipHash } = await getRequestMeta();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= 8) {
    return fail("You have sent several inquiries in the last hour. Please wait a little and try again.");
  }

  const { data: listing } = await admin
    .from("listings")
    .select("id, ref, slug, title, status, seller_id")
    .eq("id", d.listingId)
    .maybeSingle();
  if (!listing || listing.status !== "published") return fail("This listing is no longer available.");

  const account = await getAccount();
  if (account?.user.id === listing.seller_id) return fail("This is your own listing.");

  const [{ data: seller }, { data: company }] = await Promise.all([
    admin.from("profiles").select("email, contact_email, phone").eq("id", listing.seller_id).single(),
    admin.from("companies").select("name, is_suspended").eq("id", listing.seller_id).single(),
  ]);
  if (!seller || !company || company.is_suspended) return fail("This listing is no longer available.");

  const { data: inquiry, error } = await admin
    .from("inquiries")
    .insert({
      listing_id: listing.id,
      seller_id: listing.seller_id,
      buyer_name: d.name,
      buyer_company: d.company || null,
      buyer_email: d.email,
      buyer_phone: phone,
      buyer_city: d.city || null,
      buyer_country: d.country || null,
      topics: topics.map((t) => t.id),
      message: d.message || topics.map((t) => t.line).join(" "),
      ip_hash: ipHash,
    })
    .select("id")
    .single();
  if (error || !inquiry) {
    console.error("[sendInquiry] insert failed", error?.message);
    return fail("Your inquiry could not be sent. Please try again in a minute.");
  }

  const origin = await getOrigin();
  const ref = listingRef(listing.ref);
  const listingUrl = `${origin}${listingPath(listing.ref, listing.slug)}`;
  const question = [...topics.map((t) => `• ${t.line}`), d.message].filter(Boolean).join("\n");
  const location = [d.city, d.country].filter(Boolean).join(", ");
  const sellerEmail = seller.contact_email || seller.email;

  // Notify after responding, so the buyer is not kept waiting.
  after(async () => {
    const [emailRes, smsRes] = await Promise.all([
      sendEmail(
        sellerEmail,
        {
          subject: `New inquiry for ${ref}: ${listing.title}`,
          heading: `New inquiry for ${ref}`,
          intro: `${d.name} sent a question about your listing “${listing.title}”. Reply to them directly by email or phone.`,
          rows: [
            ["Buyer", d.name],
            ["Company", d.company],
            ["Email", d.email],
            ["Phone", formatPhone(phone)],
            ["Location", location],
            ["Listing", `${ref} — ${listing.title}`],
          ],
          quote: question,
          cta: { label: "Open your inquiries", url: `${origin}/dashboard/inquiries` },
          footnote:
            "This buyer was introduced by Ware Print. The 2% commission in your seller agreement applies if you sell to them.",
        },
        { replyTo: d.email },
      ),
      seller.phone
        ? sendInquiryAlert(seller.phone, { ref, title: listing.title, buyer: d.name, buyerPhone: phone })
        : Promise.resolve({ ok: false }),
      sendEmail(d.email, {
        subject: `Your inquiry for ${ref} was sent`,
        heading: "Your inquiry was sent to the seller",
        intro: `${company.name} has received your question about “${listing.title}”. They will reply to you directly at ${d.email} or ${formatPhone(phone)}.`,
        rows: [
          ["Listing", `${ref} — ${listing.title}`],
          ["Seller", company.name],
        ],
        quote: question,
        cta: { label: "View the listing", url: listingUrl },
        footnote: "Inspect a machine before paying for it. Ware Print does not handle payments between buyers and sellers.",
      }),
    ]);
    const now = new Date().toISOString();
    await admin
      .from("inquiries")
      .update({ email_sent_at: emailRes.ok ? now : null, sms_sent_at: smsRes.ok ? now : null })
      .eq("id", inquiry.id);
  });

  return { ok: true, sellerName: company.name, ref, email: d.email };
}

/** Seller marks an inquiry as replied / closed. */
export async function setInquiryStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await getAccount();
  if (!account) return fail("Please sign in again.");
  const id = str(formData.get("id"));
  const status = str(formData.get("status")) as InquiryStatus;
  if (!["new", "replied", "closed"].includes(status)) return fail("Unknown status.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("inquiries")
    .update({ status })
    .eq("id", id)
    .eq("seller_id", account.user.id);
  if (error) return fail("Could not update the inquiry.");
  revalidatePath("/dashboard/inquiries");
  return { ok: true };
}
