import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/content-page";

export const metadata: Metadata = { title: "Terms of use" };

// NOTE FOR WARE PRINT: have a lawyer review these terms before launch.

export default function TermsPage() {
  return (
    <ContentPage eyebrow="Legal" title="Terms of use" intro="Last updated: November 2026. By using Ware Print you agree to these terms.">
      <h2>1. What Ware Print is</h2>
      <p>
        Ware Print is an online marketplace where companies list printing, packaging and related machinery for sale, and
        buyers contact them. Ware Print is not the seller of any machine and is not a party to the sale between a buyer
        and a seller, unless a listing says otherwise.
      </p>

      <h2>2. Seller accounts</h2>
      <ul>
        <li>Sellers must give accurate company and contact details and verify their email address and mobile number.</li>
        <li>Each seller must sign the <Link href="/seller-agreement">seller oath &amp; commission agreement</Link> before listing.</li>
        <li>You are responsible for everything done with your account. Keep your password private.</li>
      </ul>

      <h2>3. Listings</h2>
      <ul>
        <li>Only list machines, equipment and parts that are printing, packaging or converting related and that you own or may sell.</li>
        <li>Describe each machine truthfully, including whether it is running and any known faults. Photos must show the actual machine.</li>
        <li>Do not put phone numbers, emails or links to other selling websites in listing text.</li>
        <li>
          Every listing is reviewed by Ware Print before publication. Ware Print may decline, edit for formatting, take down
          or remove any listing, and may suspend accounts that break these terms.
        </li>
      </ul>

      <h2>4. Commission</h2>
      <p>
        Listing is free. Sellers pay Ware Print a 2% commission on sales to buyers introduced by Ware Print, as set out in
        the seller oath &amp; commission agreement.
      </p>

      <h2>5. Buyers</h2>
      <ul>
        <li>Inquiries are sent to the seller with the contact details you provide. Only send genuine inquiries.</li>
        <li>
          Inspect a machine, check ownership and documents, and agree terms in writing before paying. Ware Print does not
          handle payments, transport or installation, and does not guarantee any machine.
        </li>
      </ul>

      <h2>6. Liability</h2>
      <p>
        Ware Print checks listings in good faith but cannot guarantee the accuracy of seller information, the condition
        of machines, or the outcome of any sale. To the extent allowed by law, Ware Print is not liable for losses arising
        from dealings between buyers and sellers.
      </p>

      <h2>7. Changes and contact</h2>
      <p>
        We may update these terms; the date above shows the latest version. Questions: see the{" "}
        <Link href="/contact">contact page</Link>. These terms are governed by the laws of Pakistan.
      </p>
    </ContentPage>
  );
}
