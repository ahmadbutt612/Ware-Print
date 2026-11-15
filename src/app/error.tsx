"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="wrap py-20">
      <p className="font-mono text-sm text-red">Error</p>
      <h1 className="mt-2 font-cond text-[34px] font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-xl text-ink-2">
        Please try again. If it keeps happening, contact Ware Print
        {error.digest ? (
          <>
            {" "}
            and mention code <span className="font-mono">{error.digest}</span>
          </>
        ) : null}
        .
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>
    </div>
  );
}
