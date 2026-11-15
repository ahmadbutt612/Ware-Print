import { LogoMark } from "@/components/site/logo";
import { missingSettings } from "@/lib/env";

/** Shown instead of the site until the Supabase settings are filled in. */
export function SetupRequired() {
  const missing = missingSettings();
  return (
    <main className="wrap flex min-h-dvh max-w-2xl flex-col justify-center py-16">
      <LogoMark size={36} />
      <h1 className="mt-6 font-cond text-3xl font-bold">Ware Print is not connected to its database yet</h1>
      <p className="mt-3 text-ink-2">
        The website is installed, but it needs your Supabase settings before it can show machines or let sellers sign
        up. Follow <strong>SETUP-GUIDE.md</strong>, steps 2 and 3, then restart the website.
      </p>
      {missing.length > 0 && (
        <div className="mt-6 border border-line bg-paper-2 p-4">
          <p className="text-sm font-semibold">Settings still empty:</p>
          <ul className="mt-2 space-y-1 font-mono text-sm">
            {missing.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-6 text-sm text-ink-3">
        On your computer these go in the file <code className="font-mono">.env.local</code>. On Vercel they go in
        Settings → Environment Variables.
      </p>
    </main>
  );
}
