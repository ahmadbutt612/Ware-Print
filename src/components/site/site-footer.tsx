import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { formatPhone, normalizePhone, whatsappLink } from "@/lib/phone";
import { site } from "@/lib/site";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Machines",
    links: [
      ["/machines?category=offset-printing", "Offset presses"],
      ["/machines?category=flexo-printing", "Flexo printing"],
      ["/machines?category=rotogravure-printing", "Rotogravure"],
      ["/machines?category=die-cutting", "Die cutting"],
      ["/machines?category=slitting-rewinding", "Slitting & rewinding"],
      ["/machines?kind=setup", "Complete setups"],
      ["/categories", "All categories"],
    ],
  },
  {
    title: "Sellers",
    links: [
      ["/sell", "How selling works"],
      ["/signup", "Create a seller account"],
      ["/dashboard/listings/new", "List a machine"],
      ["/seller-agreement", "Seller oath & 2% commission"],
      ["/login", "Seller sign in"],
    ],
  },
  {
    title: "Ware Print",
    links: [
      ["/about", "About"],
      ["/contact", "Contact"],
      ["/terms", "Terms of use"],
      ["/privacy", "Privacy policy"],
    ],
  },
];

export function SiteFooter() {
  const { email, phone, whatsapp, address } = site.contact;
  const phoneE164 = normalizePhone(phone);
  const whatsappE164 = normalizePhone(whatsapp);

  return (
    <footer className="mt-20 border-t border-line bg-paper-2">
      <div className="wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-ink-2">
            Pakistan&apos;s marketplace for used and new printing and packaging machinery. Every listing is checked by
            the Ware Print team before it goes live.
          </p>
          {(email || phoneE164 || whatsappE164 || address) && (
            <ul className="mt-5 space-y-1.5 text-sm text-ink-2">
              {email && (
                <li>
                  <a className="link" href={`mailto:${email}`}>
                    {email}
                  </a>
                </li>
              )}
              {phoneE164 && (
                <li>
                  <a className="link" href={`tel:${phoneE164}`}>
                    {formatPhone(phoneE164)}
                  </a>
                </li>
              )}
              {whatsappE164 && (
                <li>
                  <a className="link" href={whatsappLink(whatsappE164)} target="_blank" rel="noreferrer">
                    WhatsApp {formatPhone(whatsappE164)}
                  </a>
                </li>
              )}
              {address && <li>{address}</li>}
            </ul>
          )}
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="eyebrow">{col.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-ink-2 hover:text-ink hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-1 py-4 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ware Print. All rights reserved.</p>
          <p>Machines are sold by independent sellers. Inspect before you buy.</p>
        </div>
      </div>
    </footer>
  );
}
