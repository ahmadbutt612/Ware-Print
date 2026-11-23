import Link from "next/link";
import { IconCheck } from "@/components/ui/icons";
import type { Onboarding } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function OnboardingChecklist({ onboarding }: { onboarding: Onboarding }) {
  const steps = [
    {
      done: onboarding.emailVerified,
      title: "Confirm your email address",
      body: "Done when you opened the link in our email.",
    },
    {
      done: onboarding.companyComplete,
      title: "Add your company details",
      body: "Company name, contact person and city. Buyers see your company name and city on your listings.",
      href: "/dashboard/company",
      cta: "Add company details",
    },
    {
      done: onboarding.phoneVerified,
      title: "Verify your mobile number",
      body: "We send a 6-digit code to this number on WhatsApp. Inquiry alerts go to it too.",
      href: "/dashboard/phone",
      cta: "Verify number",
    },
    {
      done: onboarding.agreementSigned,
      title: "Sign the seller oath",
      body: "Confirm your machines are genuine, and agree to pay 2% commission on sales to buyers introduced by Ware Print.",
      href: "/dashboard/agreement",
      cta: "Read and sign",
      locked: !onboarding.companyComplete,
    },
  ];
  const nextIndex = steps.findIndex((s) => !s.done && !s.locked);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="border border-ink" aria-labelledby="checklist-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <h2 id="checklist-heading" className="font-cond text-xl font-bold">
          Finish setting up your seller account
        </h2>
        <p className="tnum text-sm text-ink-2">
          {doneCount} of {steps.length} done
        </p>
      </div>
      <ol className="divide-y divide-line">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 px-5 py-4">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center border font-mono text-xs font-medium",
                step.done ? "border-ok bg-ok text-white" : i === nextIndex ? "border-red text-red" : "border-line-strong text-ink-3",
              )}
              aria-hidden
            >
              {step.done ? <IconCheck size={14} strokeWidth={2.25} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold", step.done && "text-ink-2")}>
                {step.title}
                {step.done && <span className="sr-only"> — done</span>}
              </p>
              <p className="mt-0.5 text-sm text-ink-2">{step.body}</p>
              {step.locked && !step.done && <p className="mt-1 text-xs text-ink-3">Add your company details first.</p>}
            </div>
            {!step.done && step.href && !step.locked && (
              <Link href={step.href} className={cn("btn btn-sm shrink-0 self-center", i === nextIndex ? "btn-primary" : "btn-outline")}>
                {step.cta}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
