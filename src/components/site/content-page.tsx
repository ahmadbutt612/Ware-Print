import type { ReactNode } from "react";

/** Layout for text pages (about, terms, privacy …). */
export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
  aside,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <>
      <div className="border-b border-line bg-paper-2">
        <div className="wrap py-10">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-1 max-w-3xl font-cond text-[34px] leading-tight font-bold sm:text-[42px]">{title}</h1>
          {intro && <div className="mt-3 max-w-2xl text-[17px] text-ink-2">{intro}</div>}
        </div>
      </div>
      <div className="wrap grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="content-prose max-w-[72ch]">{children}</div>
        {aside && <aside className="space-y-4 lg:pt-1">{aside}</aside>}
      </div>
    </>
  );
}
