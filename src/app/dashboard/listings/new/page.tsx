import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ListingEditor } from "@/components/editor/listing-editor";
import { Notice } from "@/components/ui/notice";
import { requireAccount } from "@/lib/auth";
import { newDraft } from "@/lib/listing-input";

export const metadata: Metadata = { title: "List a machine" };

export default async function NewListingPage() {
  const { onboarding, company, user } = await requireAccount("/dashboard/listings/new");

  if (!onboarding.complete) {
    return (
      <div className="space-y-6">
        <DashHeader eyebrow="New listing" title="List a machine" />
        <Notice tone="warn" title={onboarding.suspended ? "Your account is suspended" : "Finish setting up your account first"}>
          {onboarding.suspended ? (
            "Please contact Ware Print."
          ) : (
            <>
              Verify your phone number, add your company details and sign the seller oath, then come back.{" "}
              <Link href="/dashboard" className="link">
                Go to your checklist
              </Link>
            </>
          )}
        </Notice>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashHeader
        eyebrow="New listing"
        title="List a machine"
        description="Fill in what you know. You can save a draft at any time and finish later. Ware Print reviews every listing before buyers see it."
      />
      <ListingEditor initial={newDraft(randomUUID(), company.city, company.country)} isNew status="draft" userId={user.id} />
    </div>
  );
}
