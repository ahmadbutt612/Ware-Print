# Ware Print — setup guide

This guide takes you from "the code is on my computer" to "the website is live". No programming
is needed. Follow the parts in order and tick the boxes as you go.

> **Tip:** In VS Code, press `Ctrl + Shift + V` while this file is open to read it with proper formatting.

| Part | What you will do | Time |
| --- | --- | --- |
| A | Create the database and see the website on your computer | 45 min |
| B | Put the website on the internet | 30 min |
| C | Switch on emails and WhatsApp | 45 min + waiting for DNS |
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
| **Gmail** (for now) → **Resend** (after you buy a domain) | Sends emails (inquiries, approvals, sign-up links) | Free (Gmail ~500/day; Resend ~3,000/month) |
| **WhatsApp Cloud API** (Meta) | Phone verification codes and inquiry alerts | Pay per message (about US$0.015 in Pakistan) |
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
- [ ] **Verify phone:** Dashboard → **Verify number**. Because WhatsApp is not set up on your computer, the
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
- [ ] The server location is set in the code (`vercel.json` → Seoul, `icn1`) so it sits next to your Supabase
      database in Seoul. If you ever move the database to another region, change it there too.

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

## Part C — Switch on emails and WhatsApp

### C1. Emails — use a Gmail account now, Resend after you buy a domain

Resend can only send to **your own** address until you verify a domain you own, so it cannot email sellers
and buyers yet. Until you buy the domain, the website sends through a Gmail account instead.
Gmail allows about 500 emails a day, which is plenty to start.

**Set up Gmail (about 10 minutes)**

- [ ] Recommended: create a separate Gmail for the business, e.g. `wareprint.pk@gmail.com`, so these emails
      don't mix with your personal inbox. Buyers and sellers will see this address.
- [ ] Sign in to that Gmail, open **myaccount.google.com → Security** and turn on **2-Step Verification**.
- [ ] Open **myaccount.google.com/apppasswords**, type the name `Ware Print website` and press **Create**.
      Copy the 16-letter password it shows. This is not your normal Gmail password, and you only see it once.
- [ ] In **Vercel → Settings → Environment Variables** add:

| Name | Value |
| --- | --- |
| `SMTP_USER` | the Gmail address |
| `SMTP_PASSWORD` | the 16-letter app password |
| `ADMIN_NOTIFICATION_EMAILS` | your email and your father's, separated by a comma |

- [ ] Put the same values in `.env.local` on your computer.
- [ ] **Sign-up and password emails also need it.** Supabase → **Authentication → Emails → SMTP Settings** →
      turn on **custom SMTP**:

| Field | Value |
| --- | --- |
| Sender email | the Gmail address |
| Sender name | `Ware Print` |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | the Gmail address |
| Password | the 16-letter app password |

- [ ] Supabase → **Authentication → Rate Limits** → raise **emails per hour** (it starts at 30) to about 100.
- [ ] Vercel → **Deployments → ⋯ → Redeploy**.

**Later, when you buy a domain — switch to Resend**

- [ ] Sign up at **resend.com** → **Domains → Add Domain** → add the DNS records it shows at your domain
      registrar → wait for **Verified**.
- [ ] **API Keys → Create API Key** → in Vercel add `RESEND_API_KEY` (the key) and
      `EMAIL_FROM` = `Ware Print <noreply@yourdomain.com>`. Once a Resend key exists the website uses it
      instead of Gmail, so you can then delete `SMTP_USER` and `SMTP_PASSWORD`.
- [ ] Supabase → **SMTP Settings**: change Host to `smtp.resend.com`, Port `465`, Username `resend`,
      Password = the Resend API key, Sender email `noreply@yourdomain.com`. Redeploy.

### C2. WhatsApp (verification codes and inquiry alerts)

The website sends two WhatsApp messages: the 6-digit code when a seller verifies their number, and an alert
to the seller when a buyer sends an inquiry. Both go through Meta's official **WhatsApp Cloud API**, with no
middleman fees. Meta charges per message. Press reports put Pakistan at about US$0.015 per code from
October 2026; check Meta's rate card for the current price.

**What you need:** a phone number for Ware Print that is **not** active in the WhatsApp or WhatsApp Business
app. A new SIM is easiest, because a number can't be on the app and the API at the same time.

**1. Create the Meta app (10 minutes)**
- [ ] Go to **developers.facebook.com** → log in with Facebook → **My Apps → Create App**.
- [ ] Choose the use case **Connect with customers through WhatsApp** (type: Business). When asked, create a
      **business portfolio** named `Ware Print`.
- [ ] In the app, open **WhatsApp → API Setup**. Meta gives you a free **test number** to start with. Under
      **To**, add your own and your father's WhatsApp numbers (test numbers can message up to 5 people).

**2. Create the message templates.** Meta must approve these, usually within minutes.
- [ ] Open **business.facebook.com → WhatsApp Manager → Message templates → Create template**.
- [ ] **Verification code template**
  - Category: **Authentication**
  - Name: `wareprint_code`
  - Language: **English (US)**
  - Code delivery: **Copy code**
  - Tick **Add security recommendation** and set the code to expire in **10 minutes**. Submit.
- [ ] **Inquiry alert template** (optional but recommended)
  - Category: **Utility**
  - Name: `inquiry_alert`
  - Language: **English (US)**
  - Body:
    `Ware Print: you have a new inquiry for {{1}} from {{2}}, phone {{3}}. The full message is in your email and your Ware Print dashboard.`
  - Sample values Meta asks for: `WP-10001 Heidelberg SM 74`, `Ahmed`, `+92 300 1234567`. Submit.

**3. Get a permanent access token.** The token on the API Setup page stops working after 24 hours.
- [ ] **business.facebook.com → Settings → Users → System users → Add**: name `ware-print-website`,
      role **Admin**.
- [ ] **Assign assets**: your app (full control) and your WhatsApp account (full control).
- [ ] **Generate new token** → choose your app → expiry **Never** → tick `whatsapp_business_messaging` and
      `whatsapp_business_management` → copy the token.

**4. Connect it to the website**
- [ ] In **WhatsApp → API Setup**, copy the **Phone number ID** (a long number, not the phone number itself).
- [ ] In **Vercel → Settings → Environment Variables** add:

| Name | Value |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | the permanent token |
| `WHATSAPP_PHONE_NUMBER_ID` | the Phone number ID |
| `WHATSAPP_OTP_TEMPLATE` | `wareprint_code` |
| `WHATSAPP_INQUIRY_TEMPLATE` | `inquiry_alert` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | `en_US` |

- [ ] Redeploy, then test: sign up with a new seller account and verify the number.

**5. Before launch — switch to your real Ware Print number**
- [ ] **WhatsApp Manager → Phone numbers → Add phone number** → enter the Ware Print SIM number, verify it
      with the code Meta sends, and set the display name **Ware Print** (Meta reviews the name).
- [ ] Add a payment method in **WhatsApp Manager → Payment settings**.
- [ ] Replace `WHATSAPP_PHONE_NUMBER_ID` in Vercel with the new number's ID and redeploy.

**If WhatsApp is not set up yet**, sellers can't get a code. Verify them by phone call instead:
**Admin → Sellers → open the seller → Verify phone by call**. (On your own computer, codes are shown on
screen for testing.)

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
      check the emails and WhatsApp messages arrive.
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

**Adding another admin** (for example your father). They sign up on the website and confirm their email, then you run
`supabase/make-admin.sql` with their email. Add their email to `ADMIN_NOTIFICATION_EMAILS` too.

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
| A seller never receives the WhatsApp code | Check the WhatsApp setup (Part C2). While using Meta's test number, only numbers added under **To** receive messages. Or verify them by phone call from **Admin → Sellers**. |
| Emails stop arriving | Gmail sends about 500 emails a day. Check the app password is still valid (Part C1), or move to Resend. |
| The website is down and Supabase says "paused" | Free projects pause after 7 days without visitors. Press **Restore** in Supabase and upgrade to Pro. |
