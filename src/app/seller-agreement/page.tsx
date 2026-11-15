import type { Metadata } from "next";
import Link from "next/link";
import { AgreementDocument } from "@/components/site/agreement-text";

export const metadata: Metadata = {
  title: "Seller oath & 2% commission agreement",
  description: "The declaration every Ware Print seller signs before listing: genuine machines, honest descriptions and a 2% commission on sales to buyers introduced by Ware Print.",
};

export default function SellerAgreementPage() {
  return (
    <>
      <div className="border-b border-line bg-paper-2">
        <div className="wrap py-10">
          <p className="eyebrow">For sellers</p>
          <h1 className="mt-1 font-cond text-[34px] leading-tight font-bold sm:text-[42px]">Seller oath &amp; commission agreement</h1>
          <p className="mt-3 max-w-2xl text-[17px] text-ink-2">
            Every seller signs this declaration once, before their first listing. It is why buyers can trust what they
            see on Ware Print.
          </p>
        </div>
      </div>
      <div className="wrap grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="max-w-3xl">
          <AgreementDocument />
        </div>
        <aside className="space-y-4">
          <div className="border border-line p-5 text-sm">
            <p className="font-semibold">In short</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-ink-2">
              <li>Listing is free.</li>
              <li>2% of the sale price, only when the buyer came through Ware Print.</li>
              <li>Only genuine machines, honestly described — including whether they run.</li>
              <li>Report the sale within 7 days.</li>
            </ul>
          </div>
          <Link href="/signup" className="btn btn-primary w-full">
            Create seller account
          </Link>
        </aside>
      </div>
    </>
  );
}
