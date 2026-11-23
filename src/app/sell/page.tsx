import type { Metadata } from "next";
import Link from "next/link";
import { LineDiagram } from "@/components/site/line-diagram";
import { getAccount } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sell your printing or packaging machine",
  description:
    "List printing and packaging machines on Ware Print for free. Verified sellers, every listing reviewed, 2% commission only when it sells to a buyer from Ware Print.",
};

const steps = [
  ["Create your seller account", "Sign up with your email and mobile number. Confirm the email link, then verify your mobile with a 6-digit code sent on WhatsApp."],
  ["Add company details and sign the seller oath", "Your company name and city appear on your listings. The oath confirms your machines are genuine and sets out the 2% commission."],
  ["List the machine", "Choose a single machine or a complete setup. Add the model, year, running status, specifications, photos and videos. Price is optional."],
  ["Ware Print reviews it", "Our team checks the listing is genuine and printing or packaging related — usually within one working day. You get an email when it is live."],
  ["Buyers contact you", "Inquiries arrive by email and WhatsApp with the buyer's name, phone and question. You reply to them directly and arrange the inspection."],
  ["Report the sale", "Mark the listing as sold. If the buyer came through Ware Print, we invoice the 2% commission."],
];

const faqs = [
  ["Do I have to show a price?", "No. Choose “Price on request” and buyers will ask you. Listings with a price usually get more serious inquiries."],
  ["Can I sell a whole production line?", "Yes. Choose “Complete setup” and add each machine — for example a flexo press, die cutter and slitter — with its own model, year, running status and specifications."],
  ["What can I list?", "Printing, converting, packaging and pre-press machines, auxiliary equipment, and spare parts or tooling for them. Ware Print declines anything unrelated."],
  ["What if my machine is not running?", "You can still list it. You must say it is not running and, ideally, what it needs. Buyers looking for repair projects filter for these."],
  ["Can I edit a listing after it is live?", "Yes. Price changes apply straight away. Other changes go back to Ware Print for a quick review before they appear."],
  ["Can buyers outside Pakistan contact me?", "Yes. Ware Print is focused on Pakistan, but buyers anywhere can send inquiries, and prices can be shown in PKR, USD, EUR, CNY, AED or GBP."],
];

export default async function SellPage() {
  const account = await getAccount();
  const start = account ? "/dashboard/listings/new" : "/signup";

  return (
    <>
      <section className="border-b border-line">
        <div className="wrap grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-16">
          <div>
            <p className="eyebrow text-red">For sellers</p>
            <h1 className="mt-2 font-cond text-[36px] leading-[1.05] font-bold sm:text-[48px]">
              Sell your printing or packaging machine to serious buyers.
            </h1>
            <p className="mt-4 max-w-xl text-[17px] text-ink-2">
              Free to list. You pay a 2% commission only when the machine sells to a buyer introduced by Ware Print.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={start} className="btn btn-primary btn-lg">
                {account ? "List a machine" : "Create seller account"}
              </Link>
              {!account && (
                <Link href="/login" className="btn btn-outline btn-lg">
                  Sign in
                </Link>
              )}
            </div>
          </div>
          <div className="border border-line p-5">
            <LineDiagram className="w-full" />
            <p className="mt-3 border-t border-line pt-3 text-sm text-ink-2">
              List single machines or complete setups. Each machine gets its own specifications and running status.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap py-12" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="font-cond text-[28px] font-bold">
          How selling works
        </h2>
        <ol className="mt-6 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="bg-paper p-6">
              <span className="font-mono text-sm font-medium text-red">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-2">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-paper-2">
        <div className="wrap grid gap-10 py-12 lg:grid-cols-2">
          <div>
            <h2 className="font-cond text-[28px] font-bold">Fees</h2>
            <table className="spec-table mt-4 border border-line bg-paper">
              <tbody>
                <tr>
                  <th scope="row">Creating an account</th>
                  <td className="font-semibold">Free</td>
                </tr>
                <tr>
                  <th scope="row">Listing machines</th>
                  <td className="font-semibold">Free — no limit, no monthly fee</td>
                </tr>
                <tr>
                  <th scope="row">Receiving inquiries</th>
                  <td className="font-semibold">Free</td>
                </tr>
                <tr>
                  <th scope="row">When it sells</th>
                  <td>
                    <strong>2% of the final sale price</strong>, only if the buyer was introduced by Ware Print
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-sm text-ink-2">
              Read the full{" "}
              <Link href="/seller-agreement" className="link">
                seller oath &amp; commission agreement
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="font-cond text-[28px] font-bold">What to have ready</h2>
            <ul className="mt-4 space-y-2.5 text-[15px] text-ink-2">
              {[
                "Clear photos: the whole machine, control panel, feeder and delivery, and the nameplate",
                "The manufacturer, model and year of manufacture",
                "Whether it is running right now, and anything that needs repair",
                "Key specifications — sheet or web size, colours, speed, impression count",
                "A short video of the machine running, if you have one",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 bg-red" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="wrap py-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-cond text-[28px] font-bold">
          Questions sellers ask
        </h2>
        <div className="mt-5 divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex items-center justify-between gap-4 font-semibold">
                {q}
                <span className="font-mono text-ink-3 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-3xl text-ink-2">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4 border border-ink p-6">
          <p className="flex-1 font-cond text-xl font-bold">Ready to list your first machine?</p>
          <Link href={start} className="btn btn-primary btn-lg">
            {account ? "List a machine" : "Create seller account"}
          </Link>
        </div>
      </section>
    </>
  );
}
