import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/content-page";
import { IconMail, IconPhone, IconPin } from "@/components/ui/icons";
import { formatPhone, normalizePhone, whatsappLink } from "@/lib/phone";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Ware Print",
  description: "Contact the Ware Print team about listings, seller accounts and commissions.",
};

export default function ContactPage() {
  const { email, phone, whatsapp, address } = site.contact;
  const phoneE164 = normalizePhone(phone);
  const whatsappE164 = normalizePhone(whatsapp);
  const hasAny = Boolean(email || phoneE164 || whatsappE164 || address);

  return (
    <ContentPage
      eyebrow="Contact"
      title="Contact Ware Print"
      intro="For questions about a specific machine, use the “Ask the seller” form on its listing — it goes straight to the seller."
    >
      {hasAny ? (
        <ul className="not-prose grid gap-px border border-line bg-line sm:grid-cols-2">
          {email && (
            <li className="bg-paper p-5">
              <IconMail size={18} className="text-red" />
              <p className="mt-2 text-sm text-ink-3">Email</p>
              <a href={`mailto:${email}`} className="font-semibold text-ink underline-offset-4 hover:underline">
                {email}
              </a>
            </li>
          )}
          {phoneE164 && (
            <li className="bg-paper p-5">
              <IconPhone size={18} className="text-red" />
              <p className="mt-2 text-sm text-ink-3">Phone</p>
              <a href={`tel:${phoneE164}`} className="font-semibold text-ink underline-offset-4 hover:underline">
                {formatPhone(phoneE164)}
              </a>
            </li>
          )}
          {whatsappE164 && (
            <li className="bg-paper p-5">
              <IconPhone size={18} className="text-red" />
              <p className="mt-2 text-sm text-ink-3">WhatsApp</p>
              <a href={whatsappLink(whatsappE164)} target="_blank" rel="noreferrer" className="font-semibold text-ink underline-offset-4 hover:underline">
                {formatPhone(whatsappE164)}
              </a>
            </li>
          )}
          {address && (
            <li className="bg-paper p-5">
              <IconPin size={18} className="text-red" />
              <p className="mt-2 text-sm text-ink-3">Office</p>
              <p className="font-semibold text-ink">{address}</p>
            </li>
          )}
        </ul>
      ) : (
        <p>Contact details will be published here soon.</p>
      )}

      <h2>Selling on Ware Print</h2>
      <p>
        Questions about your seller account, a listing under review, phone verification or a commission invoice? Contact
        us with your company name and the listing reference (for example WP-10234).
      </p>
      <p>
        New to selling? Read <Link href="/sell">how selling works</Link> or <Link href="/signup">create a seller account</Link>.
      </p>

      <h2>Report a listing</h2>
      <p>
        If you think a listing is not genuine or is misleading, contact us with its reference number. We review every
        report.
      </p>
    </ContentPage>
  );
}
