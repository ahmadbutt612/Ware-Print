import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingRow } from "@/components/listings/listing-row";
import { Pagination } from "@/components/listings/pagination";
import { IconPin } from "@/components/ui/icons";
import { VerifiedMark } from "@/components/ui/status";
import { getPublicCompany, searchListings } from "@/lib/data/listings";
import { formatDate } from "@/lib/format";
import { firstParam } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/sellers/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return {};
  const company = await getPublicCompany(id);
  if (!company?.name) return { title: "Seller" };
  return {
    title: `${company.name} — machines for sale`,
    description: `Printing and packaging machines for sale from ${company.name}, ${company.city}.`,
  };
}

export default async function SellerPage({ params, searchParams }: PageProps<"/sellers/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const company = await getPublicCompany(id);
  if (!company || !company.name || company.is_suspended) notFound();

  const page = Math.max(1, Number(firstParam((await searchParams).page)) || 1);
  const { rows, total } = await searchListings({ seller: id, page, perPage: 20 });

  return (
    <>
      <div className="border-b border-line bg-paper-2">
        <div className="wrap py-8">
          <p className="eyebrow">Seller</p>
          <h1 className="mt-1 font-cond text-[34px] leading-tight font-bold">{company.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-2">
            <span className="inline-flex items-center gap-1">
              <IconPin size={14} /> {company.city}, {company.country}
            </span>
            {company.verified_at && <VerifiedMark label="Email and phone verified" />}
            <span>On Ware Print since {formatDate(company.created_at)}</span>
          </div>
          {company.about && <p className="mt-4 max-w-3xl whitespace-pre-line text-ink-2">{company.about}</p>}
        </div>
      </div>
      <div className="wrap py-8">
        <h2 className="font-cond text-xl font-bold">
          Machines for sale <span className="font-normal text-ink-3">({total})</span>
        </h2>
        {rows.length === 0 ? (
          <p className="mt-4 border border-line bg-paper-2 p-6 text-sm text-ink-2">This seller has no live listings right now.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((l) => (
              <ListingRow key={l.id} listing={l} />
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 20))} hrefFor={(p) => `/sellers/${id}${p > 1 ? `?page=${p}` : ""}`} />
      </div>
    </>
  );
}
