import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/content-page";

export const metadata: Metadata = { title: "Privacy policy" };

// NOTE FOR WARE PRINT: have a lawyer review this policy before launch.

export default function PrivacyPage() {
  return (
    <ContentPage eyebrow="Legal" title="Privacy policy" intro="Last updated: November 2026. This explains what information Ware Print keeps and why.">
      <h2>Information we collect</h2>
      <h3>From sellers</h3>
      <ul>
        <li>Name, company name, email address, mobile number, city, country and (optionally) business address and website.</li>
        <li>Listings, photos and videos you upload.</li>
        <li>Your signed seller oath, with the date, time and IP address of signing.</li>
        <li>Sales you report, for commission records.</li>
      </ul>
      <h3>From buyers</h3>
      <ul>
        <li>The name, company, email, phone number, location and message you enter in an inquiry form.</li>
      </ul>
      <h3>Automatically</h3>
      <ul>
        <li>A login cookie when you sign in, and a scrambled (hashed) form of your IP address to limit spam.</li>
        <li>How many times each listing is viewed. We do not use advertising trackers.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To show listings with the seller&apos;s company name and city.</li>
        <li>To send your inquiry to the seller of that listing — the seller receives your contact details so they can reply.</li>
        <li>To verify sellers, review listings, prevent fraud and keep records of introductions and commissions.</li>
        <li>To send account emails and text messages (verification codes, inquiry alerts, review decisions).</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        A seller&apos;s email address, phone number and address are never shown publicly. Buyer details go only to the
        seller of the listing the buyer asked about. We use trusted service providers to run the website: Supabase
        (database and file storage), Vercel (hosting), Resend (email) and Twilio (SMS). We do not sell personal data.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep account and listing data while your account is open. Inquiries, signed oaths and sale records are kept for
        as long as needed for commission and legal records.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update your company details in your dashboard at any time. To close your account or ask for a copy or
        deletion of your data, <Link href="/contact">contact us</Link>.
      </p>
    </ContentPage>
  );
}
