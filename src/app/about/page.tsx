import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/content-page";

export const metadata: Metadata = {
  title: "About Ware Print",
  description: "Ware Print is a marketplace for printing and packaging machinery in Pakistan, where every listing is reviewed before it is published.",
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About"
      title="A marketplace built for the print and packaging trade"
      intro="Ware Print connects companies selling printing and packaging machinery with buyers who need it — in Pakistan first, and from anywhere."
      aside={
        <div className="border border-line p-5 text-sm">
          <p className="font-semibold">Start here</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link href="/machines" className="link">
                Browse machines
              </Link>
            </li>
            <li>
              <Link href="/sell" className="link">
                How selling works
              </Link>
            </li>
            <li>
              <Link href="/contact" className="link">
                Contact Ware Print
              </Link>
            </li>
          </ul>
        </div>
      }
    >
      <h2>Why Ware Print exists</h2>
      <p>
        Buying a used press, die cutter or slitter is a large decision. Machines change hands through word of mouth,
        brokers and scattered adverts, and it is hard to know what is genuine, what condition it is in, and whether it
        actually runs.
      </p>
      <p>Ware Print puts machinery listings in one place, with the details buyers need to compare them properly.</p>

      <h2>How we keep listings trustworthy</h2>
      <ul>
        <li>
          <strong>Verified sellers.</strong> Every seller confirms their email address and verifies their mobile number
          before they can list.
        </li>
        <li>
          <strong>Seller oath.</strong> Sellers sign a declaration that their machines exist, are described honestly and
          are theirs to sell.
        </li>
        <li>
          <strong>Every listing reviewed.</strong> The Ware Print team checks each listing before it is published, and again
          when it is changed.
        </li>
        <li>
          <strong>Running status on every machine.</strong> Sellers must say whether each machine is running right now.
        </li>
      </ul>

      <h2>What you can find here</h2>
      <p>
        Offset, flexo, rotogravure, label and digital presses; die cutters, slitters, laminators, guillotines and folder
        gluers; bag making, corrugation and blown film lines; pre-press equipment, auxiliary machines and spare parts —
        and complete setups sold as one line.
      </p>

      <h2>How buying works</h2>
      <p>
        Buyers do not need an account. Send an inquiry from any listing and it goes straight to the seller, who replies
        to you directly. Always inspect a machine before paying — see our <Link href="/terms">terms of use</Link>.
      </p>
    </ContentPage>
  );
}
