// The seller oath and 2% commission agreement.
//
// IMPORTANT FOR WARE PRINT: have a lawyer review this text before launch.
// The time limits (12 months, 7 days, 15 days) are suggestions — change them
// here if your terms differ. When you change the wording, also change
// AGREEMENT_VERSION: every seller will then be asked to sign the new version
// before they can submit more listings.

export const AGREEMENT_VERSION = "2026-11";

export const COMMISSION_PERCENT = 2;

export function agreementClauses(): { title: string; body: string }[] {
  return [
    {
      title: "Commission",
      body: `I will pay Ware Print a commission of ${COMMISSION_PERCENT}% (two percent) of the final sale price of any machine, part or complete setup that I list on Ware Print and sell to a buyer introduced by Ware Print.`,
    },
    {
      title: "Introduced buyers",
      body: "A buyer is introduced by Ware Print if they contacted me through a Ware Print inquiry, or if they first learned about the machine from its Ware Print listing. This applies to any sale agreed with that buyer within 12 months of their first contact, even if the deal is completed outside Ware Print.",
    },
    {
      title: "Reporting a sale",
      body: "I will mark the listing as sold on Ware Print and report the final sale price within 7 days of agreeing the sale.",
    },
    {
      title: "Payment",
      body: "I will pay the commission to Ware Print within 15 days of receiving payment from the buyer, using the payment details on Ware Print's invoice.",
    },
    {
      title: "Honest listings",
      body: "Every machine I list exists, is printing or packaging related, and is described truthfully, including whether it is running. I own it or have the owner's written permission to sell it.",
    },
    {
      title: "Review and removal",
      body: "Ware Print may review, decline or remove any listing, and may suspend my account if I break this agreement or list machines that are not genuine.",
    },
    {
      title: "Record",
      body: "Ware Print keeps a copy of this agreement with the name I type below, the date and time, and my IP address. This agreement is governed by the laws of Pakistan.",
    },
  ];
}

/** Plain-text copy stored with each signature. */
export function agreementText(signedName: string, companyName: string): string {
  const clauses = agreementClauses()
    .map((c, i) => `${i + 1}. ${c.title}. ${c.body}`)
    .join("\n\n");
  return [
    `WARE PRINT SELLER OATH & COMMISSION AGREEMENT (version ${AGREEMENT_VERSION})`,
    "",
    `I, ${signedName}, on behalf of ${companyName}, solemnly declare and agree:`,
    "",
    clauses,
  ].join("\n");
}
