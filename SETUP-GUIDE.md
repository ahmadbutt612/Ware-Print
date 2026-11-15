# Ware Print — setup guide

This guide takes you from "the code is on my computer" to "the website is live". No programming
is needed. Follow the parts in order and tick the boxes as you go.

> **Tip:** In VS Code, press `Ctrl + Shift + V` while this file is open to read it with proper formatting.

| Part | What you will do | Time |
| --- | --- | --- |
| A | Create the database and see the website on your computer | 45 min |
| B | Put the website on the internet | 30 min |
| C | Switch on emails and text messages (SMS) | 45 min + waiting for DNS |
| D | Final checks before launch | — |
| E | How to run Ware Print day to day | — |

---

## Accounts you will need (and what they cost)

Prices change; check each website. All of these can be started free.

| Service | What it does for Ware Print | Cost |
| --- | --- | --- |
| **Supabase** (supabase.com) | Database, logins, photo and video storage | Free to start. The free plan **pauses after 7 days without visitors** — upgrade to Pro (about US$25/month) before launch. |
| **Vercel** (vercel.com) | Hosts the website | Free "Hobby" plan for testing. Hobby is for non-commercial use, so move to Pro (about US$20/month) when you launch. |
| **GitHub** (github.com) | Keeps a copy of the code; Vercel deploys from it | Free |
| **Resend** (resend.com) | Sends emails (inquiries, approvals, sign-up links) | Free up to about 3,000 emails/month |
| **Twilio** (twilio.com) | Sends SMS (phone verification codes, inquiry alerts) | Pay per message |
| **Domain name** | e.g. `wareprint.pk` or `wareprint.com` | About US$10–15/year for .com |

---

## Part A — See the website on your computer

### A1. Create the Supabase project

- [ ] Go to **supabase.com** → **Start your project** → sign up (signing in with GitHub is fine).
- [ ] Click **New project**.
  - **Name:** `wareprint`
  - **Database password:** press **Generate a password**, then save it in a safe place.
  - **Region:** **South Asia (Mumbai)** — the closest to Pakistan, so pages load fastest.
- [ ] Click **Create new project** and wait 1–2 minutes.

### A2. Create the database tables

- [ ] In Supabase, open **SQL Editor** (left menu) → **New query**.
- [ ] In VS Code, open the file `supabase/schema.sql`, press `Ctrl + A` then `Ctrl + C` to copy everything.
- [ ] Paste it into the Supabase query box and press **Run**.
- [ ] You should see **"Success. No rows returned"**. (Running it twice does no harm.)

This creates every table, the security rules, the search, and the storage space for photos and videos.

### A3. Connect the website to the database

- [ ] In VS Code, open the file **`.env.local`** (it is in the main folder, next to `package.json`).
- [ ] In Supabase, go to **Project Settings → API Keys** (on some screens: **Project Settings → API**).
  Copy these values into `.env.local`, after the `=` sign, with no spaces or quotes:

| In `.env.local` | Where to find it in Supabase |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL**, like `https://abcdefgh.supabase.co` (on the project home page, or Project Settings → Data API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The **Publishable key** (starts `sb_publishable_`). Older projects call it the **anon public** key. |
| `SUPABASE_SECRET_KEY` | A **Secret key** (starts `sb_secret_`) — press **Reveal**. Older projects call it **service_role**. **Never share this key or put it anywhere public.** |

- [ ] Put your own email in `ADMIN_NOTIFICATION_EMAILS=` (you will get "new listing to review" emails once email is switched on in Part C).
- [ ] Save the file (`Ctrl + S`).

### A4. Tell Supabase where the website lives

- [ ] Supabase → **Authentication → URL Configuration**:
  - **Site URL:** `http://localhost:3000` (you will change this to your real domain in Part B)
  - **Redirect URLs** → **Add URL** → `http://localhost:3000/**`
- [ ] Supabase → **Authentication → Emails** (Templates):
  - Open **Confirm signup**. Set the subject to `Confirm your Ware Print seller account`. Replace the message
    body with the contents of `supabase/email-templates/confirm-signup.html`. **Save**.
  - Open **Reset password**. Set the subject to `Reset your Ware Print password`. Replace the message body
    with the contents of `supabase/email-templates/reset-password.html`. **Save**.

### A5. Start the website

- [ ] In VS Code: menu **Terminal → New Terminal**.
- [ ] Type `npm run dev` and press Enter. Wait for **Ready**.
- [ ] Open **http://localhost:3000** in your browser. You should see the Ware Print home page.

To stop the website, click in the terminal and press `Ctrl + C`. To start it again, run `npm run dev`.
(If you ever copy the project to another computer, run `npm install` once first.)

### A6. Test drive the whole journey

Until Part C is done, Supabase sends only a few emails per hour, and only to the email address you used to
create your Supabase account. Use that email for this test.

- [ ] **Sign up:** go to **Sell a machine → Create seller account**, fill in the form.
- [ ] **Confirm email:** open the email from Supabase and press **Confirm my email**. You land on your dashboard.
- [ ] **Verify phone:** Dashboard → **Verify number**. Because SMS is not set up on your computer, the
      6-digit code is shown on screen. Type it in.
- [ ] **Company details:** add your city if it is missing.
- [ ] **Seller oath:** read it, type your name exactly as shown, tick the box, sign.
- [ ] **List a machine:** **List a machine** → fill in the form, add a photo → **Submit for review**.
- [ ] **Make yourself admin:** open `supabase/make-admin.sql`, change `owner@example.com` to your email,
      copy it all, paste into Supabase **SQL Editor → New query → Run**. Refresh the website: an **Admin**
      button appears at the top.
- [ ] **Approve it:** **Admin → Listings to review** → open your listing → **Approve & publish**.
- [ ] **Be a buyer:** open http://localhost:3000 in a private/incognito window, find the machine, and send
      an inquiry. Then check **Dashboard → Inquiries** in your normal window.

If all of that works, the website is working. 🎉

---

## Part B — Put the website on the internet

### B1. Put the code on GitHub

The easiest way without commands is **GitHub Desktop**:

- [ ] Create a free account at **github.com**.
- [ ] Install **GitHub Desktop** (desktop.github.com) and sign in.
- [ ] **File → Add local repository** → choose the `Ware Print` folder.
- [ ] Type a summary like `Ware Print website` and press **Commit to main**.
- [ ] Press **Publish repository**. **Keep "Keep this code private" ticked.**

(Your `.env.local` file with the secret keys is never uploaded — it is excluded on purpose.)

### B2. Deploy on Vercel

- [ ] Go to **vercel.com** → sign up with GitHub.
- [ ] **Add New → Project** → choose your Ware Print repository → **Import**.
- [ ] Open **Environment Variables**. Copy all the lines from your `.env.local` and paste them into the
      first "Key" box — Vercel splits them up automatically.
- [ ] Press **Deploy** and wait about 2 minutes. Vercel gives you an address like
      `https://wareprint.vercel.app`.
- [ ] In Vercel: **Settings → Environment Variables** → change `NEXT_PUBLIC_SITE_URL` to that address →
      then **Deployments → ⋯ → Redeploy**.
- [ ] Recommended: **Settings → Functions → Function Region → Mumbai (bom1)**, next to your database.
      Redeploy again.

### B3. Connect your domain name

- [ ] Buy your domain (for `.pk`, use a PKNIC-approved registrar; for `.com`, any registrar).
- [ ] Vercel → your project → **Settings → Domains** → add your domain and follow the instructions it shows
      (you add one or two records at your domain registrar).
- [ ] When the domain works, change `NEXT_PUBLIC_SITE_URL` in Vercel to `https://yourdomain.com` and redeploy.

### B4. Point Supabase at the live website

- [ ] Supabase → **Authentication → URL Configuration**:
  - **Site URL:** `https://yourdomain.com`
  - **Redirect URLs:** keep `http://localhost:3000/**` and add `https://yourdomain.com/**` and
    `https://wareprint.vercel.app/**` (your Vercel address).

---

## Part C — Switch on emails and SMS

### C1. Emails (Resend)

- [ ] Sign up at **resend.com**.
- [ ] **Domains → Add Domain** → your domain. Resend shows a few DNS records: add them at your domain
      registrar (or in Vercel → Domains, if Vercel manages your domain). Wait until it says **Verified**
      (minutes to a few hours).
- [ ] **API Keys → Create API Key** (sending access) → copy it.
- [ ] In **Vercel → Settings → Environment Variables**:
  - `RESEND_API_KEY` = the key
  - `EMAIL_FROM` = `Ware Print <noreply@yourdomain.com>`
  - `ADMIN_NOTIFICATION_EMAILS` = your email (several allowed, separated by commas)
- [ ] Supabase → **Authentication → Emails → SMTP Settings** → turn on **custom SMTP**:

| Field | Value |
| --- | --- |
| Sender email | `noreply@yourdomain.com` |
| Sender name | `Ware Print` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key |

- [ ] Supabase → **Authentication → Rate Limits** → raise **emails per hour** (it starts at 30) to about 100.
- [ ] Vercel → **Redeploy**.

### C2. Text messages (Twilio)

SMS is used for phone verification codes and for "new inquiry" alerts to sellers.

- [ ] Sign up at **twilio.com** and verify your own phone number.
- [ ] Buy a phone number with SMS (Console → **Phone Numbers → Buy a number**).
- [ ] From the Twilio Console home page, copy the **Account SID** and **Auth Token**.
- [ ] Read Twilio's Pakistan rules at **twilio.com/en-us/guidelines/pk/sms**. Pakistani networks may require
      the sender to be registered first — ask Twilio support to confirm what applies to your account.
- [ ] Add funds to your Twilio account. A trial account can only text numbers you have verified yourself.
- [ ] In **Vercel → Environment Variables**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and
      `TWILIO_FROM_NUMBER` (the number you bought, like `+12025550123`). Redeploy.

**If SMS to Pakistan is slow, expensive or blocked**, you can still run Ware Print:
- Verify sellers by phone call: **Admin → Sellers → open the seller → Verify phone by call**.
- Set `SEND_INQUIRY_SMS=false` to stop inquiry alerts by SMS (sellers still get them by email).
- A developer can connect a Pakistani SMS company instead of Twilio by changing one file (`src/lib/sms.ts`).

### C3. Your public contact details (optional)

Add these in Vercel so they appear in the footer and on the Contact page, then redeploy:
`NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_WHATSAPP`, `NEXT_PUBLIC_CONTACT_ADDRESS`.

---

## Part D — Before you launch

- [ ] **Legal review.** Ask a lawyer to read the seller oath (shown at `/seller-agreement`), the Terms
      (`/terms`) and the Privacy policy (`/privacy`). The oath's time limits — 12 months, 7 days, 15 days — are
      suggestions. Send the changes to your developer (the oath text is in `src/lib/agreement.ts`).
- [ ] **Upgrade Supabase to Pro**, so the site never pauses and you get daily backups.
- [ ] **Upgrade Vercel to Pro** for commercial use.
- [ ] **Test with real people:** sign up with an email that is not yours and a Pakistani mobile number;
      check the emails and SMS arrive.
- [ ] **Remove test data:** Supabase → **Authentication → Users** → delete test accounts (their listings are
      deleted with them).

---

## Part E — Running Ware Print day to day

**Reviewing listings.** You get an email when a listing is submitted or edited. Open **Admin → Listings to
review** (oldest first). Each listing shows automatic checks (photos, phone numbers hidden in the text,
verified phone, signed oath) and an exact preview. Then:
- **Approve & publish** — it goes live and the seller is emailed.
- **Request changes** — write what to fix; the seller is emailed and can resubmit.
- **Reject** — for fake or non-printing items; the seller cannot resubmit it.

**When sellers edit a live listing**, it goes back to your review queue and is hidden until approved.
Price changes are the exception — they apply immediately.

**Commission.** When a seller marks a machine as sold, you are emailed. Open **Admin → Sales & commission**.
2% is calculated for you when the buyer came through Ware Print. Change the status to **Invoiced** and then
**Paid**, and note your invoice number. If a seller says the buyer was "found elsewhere", compare with
**Admin → Inquiries** — every buyer who contacted the seller through Ware Print is recorded there.

**Problem sellers.** **Admin → Sellers → open the seller → Suspend seller** hides all their listings at once.

**Adding another admin.** They sign up on the website, then you run `supabase/make-admin.sql` with their email.

**Changing the seller oath.** Edit the text and change the version in `src/lib/agreement.ts`. Every seller is
asked to sign the new version before submitting more listings.

---

## If something goes wrong

| What you see | What to do |
| --- | --- |
| "Ware Print is not connected to its database yet" | A value in `.env.local` (or in Vercel) is empty or wrong. Fix it and restart `npm run dev` (or redeploy). |
| The confirmation email never arrives | Check spam. Before Part C, Supabase only emails your own address, a few times per hour. Part C fixes this. |
| "That link has expired or was already used" | Each link works once. Check that **Site URL** and **Redirect URLs** in Supabase match your website address. |
| "Upload not allowed" when adding photos | The seller has not verified their phone yet. |
| A seller never receives the SMS code | Check the Twilio setup (Part C2), or verify them by phone call from **Admin → Sellers**. |
| The website is down and Supabase says "paused" | Free projects pause after 7 days without visitors. Press **Restore** in Supabase and upgrade to Pro. |
