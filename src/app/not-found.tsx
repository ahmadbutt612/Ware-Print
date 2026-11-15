import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap py-20">
      <p className="font-mono text-sm text-red">404</p>
      <h1 className="mt-2 font-cond text-[34px] font-bold">This page could not be found</h1>
      <p className="mt-2 max-w-xl text-ink-2">
        The machine may have been sold or removed, or the link may be wrong.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/machines" className="btn btn-primary">
          Browse machines
        </Link>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>
    </div>
  );
}
