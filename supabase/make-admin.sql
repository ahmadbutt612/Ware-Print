-- Make a Ware Print team member an admin (can approve listings, see all inquiries and sales).
--
-- 1. Sign up on the website first with the email you want to use.
-- 2. Change the email address below to that email.
-- 3. Paste into Supabase → SQL Editor → New query → Run.

update public.profiles
   set role = 'admin'
 where lower(email) = lower('zagsales02@gmail.com');   -- ← change this

-- This should now list your account:
select email, role, created_at from public.profiles where role = 'admin';


-- To remove admin access later, run:
-- update public.profiles set role = 'seller' where lower(email) = lower('someone@example.com');
