# Ware Print

Marketplace for printing and packaging machinery, focused on Pakistan. Verified sellers list single
machines or complete setups; every listing is reviewed by the Ware Print team before it is published;
buyers send inquiries that go to the seller by email and SMS. Sellers sign an oath agreeing to a 2%
commission on sales to buyers introduced by Ware Print.

**Non-technical setup and operations:** see [SETUP-GUIDE.md](SETUP-GUIDE.md).

## Stack

- Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, TypeScript, Tailwind CSS 4
- Supabase: Postgres + Row Level Security, Auth (email/password), Storage (photos/videos)
- Email via Gmail SMTP (before a domain) or Resend · WhatsApp Cloud API (Meta) for codes and alerts, Twilio SMS as optional backup
- Hosting: Vercel, functions pinned to `icn1` (Seoul) in `vercel.json` to sit next to the Supabase project (ap-northeast-2)

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev                  # http://localhost:3000
```

Without Twilio settings, phone verification codes are shown on screen in development (never in
production). Without a Resend key, emails are printed to the terminal in development.

## Layout

| Path | Contents |
| --- | --- |
| `supabase/schema.sql` | Entire database: tables, RLS, search/facet functions, atomic `save_listing`, storage bucket and policies. Idempotent. |
| `supabase/make-admin.sql`, `supabase/email-templates/` | Admin promotion snippet; Supabase Auth email templates (token-hash links). |
| `src/app/` | Routes. Public: `/`, `/machines`, `/machines/[ref]`, `/sellers/[id]`, `/categories`, `/sell`, legal pages. Auth: `/login`, `/signup`, `/check-email`, `/forgot-password`, `/reset-password`, `/auth/confirm`. Seller: `/dashboard/**`. Team: `/admin/**`. |
| `src/actions/` | Server Actions — every write in the app. |
| `src/lib/auth.ts` | Data access layer: current user, profile, company, onboarding state, `requireAdmin`. |
| `src/lib/categories.ts` | Machine categories and suggested specification fields. |
| `src/lib/agreement.ts` | Seller oath text and `AGREEMENT_VERSION` (bump to make sellers re-sign). |
| `src/lib/listing-input.ts` | Listing draft shape and `validateForSubmit`, shared by editor and server. |
| `src/components/editor/` | Listing editor (machines, specs, client-side image resizing and direct-to-storage upload). |

## Security model

- Browsers can only **read**: RLS exposes published/sold listings and public company data to everyone,
  and a seller's own rows to that seller. Insert/update/delete privileges are revoked from `anon` and
  `authenticated`.
- All writes run in Server Actions with the secret key, after explicit checks of the session, ownership,
  role and onboarding state.
- Sellers need a confirmed email, a verified phone (6-digit SMS code, HMAC-hashed, 10-minute expiry,
  5 attempts, send limits), complete company details and the current oath version before listing.
- Storage uploads are allowed only into `listing-media/<user id>/…` and only for phone-verified,
  non-suspended sellers (enforced by a storage policy).
- Listing workflow: `draft → pending → published | changes_requested | rejected`; editing a published
  listing returns it to `pending`; price-only updates skip review; sellers report sales (`sold`) with
  commission computed at 2%.
- Seller email/phone are never public. Inquiries are stored as the record of introductions.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
