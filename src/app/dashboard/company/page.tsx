import type { Metadata } from "next";
import { saveCompany } from "@/actions/account";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { requireAccount } from "@/lib/auth";
import { COUNTRIES, PAKISTAN_CITIES } from "@/lib/site";

export const metadata: Metadata = { title: "Company details" };

export default async function CompanyPage() {
  const { profile, company, user } = await requireAccount("/dashboard/company");

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow="Account"
        title="Company details"
        description="Buyers see your company name, city and the “About” text. Your address and contact details stay private."
      />
      <ActionForm action={saveCompany} className="max-w-3xl space-y-5">
        <FormMessage />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField name="companyName" label="Company name" required>
            <input id="companyName" name="companyName" defaultValue={company.name} autoComplete="organization" className="field-input" />
          </FormField>
          <FormField name="fullName" label="Contact person" required hint="Your full name. Used when you sign the seller oath.">
            <input id="fullName" name="fullName" defaultValue={profile.full_name} autoComplete="name" className="field-input" />
          </FormField>
          <FormField name="city" label="City" required>
            <input id="city" name="city" list="cities" defaultValue={company.city} autoComplete="address-level2" className="field-input" />
            <datalist id="cities">
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
          <FormField name="country" label="Country" required>
            <input
              id="country"
              name="country"
              list="countries"
              defaultValue={company.country || "Pakistan"}
              autoComplete="country-name"
              className="field-input"
            />
            <datalist id="countries">
              {COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
        </div>

        <FormField name="address" label="Business address" optional hint="Private. Only the Ware Print team sees it.">
          <input id="address" name="address" defaultValue={profile.address ?? ""} autoComplete="street-address" className="field-input" />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            name="contactEmail"
            label="Email for buyer inquiries"
            hint={`Leave empty to use your login email (${user.email}).`}
          >
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={profile.contact_email && profile.contact_email !== user.email ? profile.contact_email : ""}
              className="field-input"
            />
          </FormField>
          <FormField name="website" label="Website" optional>
            <input id="website" name="website" defaultValue={company.website ?? ""} placeholder="www.yourcompany.com" className="field-input" />
          </FormField>
        </div>

        <FormField name="about" label="About your company" optional hint="Shown on your public seller page. What you make, print or trade, and since when.">
          <textarea id="about" name="about" rows={5} maxLength={1500} defaultValue={company.about ?? ""} className="field-input" />
        </FormField>

        <div className="border-t border-line pt-5">
          <PendingButton pendingText="Saving…">Save company details</PendingButton>
        </div>
      </ActionForm>
    </div>
  );
}
