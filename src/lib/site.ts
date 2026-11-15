// Business settings for Ware Print. Contact details come from environment
// variables so they can be changed in Vercel without touching code.

export const site = {
  name: "Ware Print",
  shortDescription: "Printing & packaging machinery marketplace",
  description:
    "Buy and sell used and new printing and packaging machinery in Pakistan: offset presses, flexo and rotogravure lines, die cutters, slitters and complete production setups from verified sellers.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim().replace(/\/+$/, ""),
  country: "Pakistan",
  commissionRate: 0.02,
  contact: {
    email: (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim(),
    phone: (process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "").trim(),
    whatsapp: (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "").trim(),
    address: (process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? "").trim(),
  },
} as const;

export function absoluteUrl(path: string): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Faisalabad",
  "Rawalpindi",
  "Islamabad",
  "Gujranwala",
  "Sialkot",
  "Multan",
  "Peshawar",
  "Hyderabad",
  "Quetta",
  "Sheikhupura",
  "Kasur",
  "Sargodha",
  "Bahawalpur",
  "Gujrat",
  "Sukkur",
  "Hub",
  "Mardan",
  "Abbottabad",
  "Wah Cantt",
  "Nowshera",
] as const;

export const COUNTRIES = [
  "Pakistan",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Oman",
  "Bahrain",
  "Kuwait",
  "Afghanistan",
  "Bangladesh",
  "Sri Lanka",
  "China",
  "Turkey",
  "Germany",
  "Italy",
  "Japan",
  "United Kingdom",
  "United States",
] as const;

export const CURRENCIES = ["PKR", "USD", "EUR", "CNY", "AED", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];
