import { AGREEMENT_VERSION, agreementClauses } from "@/lib/agreement";

/** The seller oath, laid out like a printed document. */
export function AgreementDocument({ name, company }: { name?: string; company?: string }) {
  return (
    <article className="crop border border-ink bg-paper p-6 sm:p-8">
      <header className="border-b border-line pb-4">
        <p className="eyebrow">Ware Print · Version {AGREEMENT_VERSION}</p>
        <h2 className="mt-1 font-cond text-2xl font-bold">Seller oath &amp; commission agreement</h2>
        <p className="mt-2 text-sm text-ink-2">
          I, <strong className="text-ink">{name || "[seller's full name]"}</strong>, on behalf of{" "}
          <strong className="text-ink">{company || "[company name]"}</strong>, solemnly declare and agree:
        </p>
      </header>
      <ol className="mt-4 space-y-4">
        {agreementClauses().map((clause, i) => (
          <li key={clause.title} className="grid grid-cols-[2rem_1fr] gap-1 text-[15px] leading-relaxed">
            <span className="font-mono text-sm leading-relaxed text-red">{String(i + 1).padStart(2, "0")}</span>
            <p>
              <strong>{clause.title}.</strong> <span className="text-ink-2">{clause.body}</span>
            </p>
          </li>
        ))}
      </ol>
    </article>
  );
}
