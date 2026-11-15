-- =====================================================================
--  WARE PRINT — database setup
--
--  How to use: Supabase dashboard → SQL Editor → New query →
--  paste this whole file → Run.  It is safe to run more than once.
--
--  Security model
--  * Visitors (anon) can read published listings and public company info.
--  * Signed-in sellers can read their own private data.
--  * Every write goes through the website's server code, which uses the
--    secret service-role key after checking who the user is. Nobody can
--    write to these tables directly from a browser.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- Private account data, one row per user (created automatically on sign-up).
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  role                text not null default 'seller' check (role in ('seller', 'admin')),
  email               text not null default '',
  email_confirmed_at  timestamptz,
  full_name           text not null default '',
  contact_email       text,             -- where buyer inquiries are sent
  address             text,             -- private business address
  phone               text,             -- verified number, E.164 format (+923001234567)
  phone_pending       text,             -- number typed at sign-up, not yet verified
  phone_verified_at   timestamptz,
  agreement_signed_at timestamptz,
  agreement_version   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists profiles_phone_key on public.profiles (phone) where phone is not null;

-- Public company details shown next to listings.
create table if not exists public.companies (
  id           uuid primary key references public.profiles (id) on delete cascade,
  name         text not null default '',
  city         text not null default '',
  country      text not null default 'Pakistan',
  website      text,
  about        text,
  verified_at  timestamptz,               -- set when email + phone are verified
  is_suspended boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create sequence if not exists public.listing_ref_seq start with 10001;

-- A listing is one ad. It holds one machine, or several for a complete setup.
create table if not exists public.listings (
  id                        uuid primary key default gen_random_uuid(),
  ref                       bigint not null unique default nextval('public.listing_ref_seq'),
  seller_id                 uuid not null references public.profiles (id) on delete cascade,
  status                    text not null default 'draft'
                            check (status in ('draft', 'pending', 'changes_requested', 'published', 'rejected', 'sold', 'archived')),
  kind                      text not null default 'single' check (kind in ('single', 'setup')),
  title                     text not null default '',
  slug                      text not null default '',
  primary_category          text not null default '',
  categories                text[] not null default '{}',
  description               text not null default '',
  -- summary of the first machine, used on cards and in filters
  manufacturer              text not null default '',
  model                     text not null default '',
  year                      int,
  condition                 text check (condition in ('new', 'used', 'refurbished')),
  operational_status        text check (operational_status in ('running', 'not_running', 'partly_running')),
  item_count                int not null default 1,
  -- price (optional)
  price_type                text not null default 'on_request' check (price_type in ('fixed', 'negotiable', 'on_request')),
  price_amount              numeric(14, 2),
  price_currency            text not null default 'PKR',
  -- where the machine is
  city                      text not null default '',
  country                   text not null default 'Pakistan',
  availability              text,
  inspection_available      boolean not null default true,
  loading_assistance        boolean not null default false,
  cover_path                text,
  cover_thumb_path          text,
  search_text               text not null default '',
  search_vector             tsvector generated always as (to_tsvector('english', search_text)) stored,
  -- review workflow
  authenticity_confirmed_at timestamptz,
  submitted_at              timestamptz,
  reviewed_at               timestamptz,
  reviewed_by               uuid references public.profiles (id) on delete set null,
  review_note               text,
  published_at              timestamptz,
  sold_at                   timestamptz,
  view_count                int not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists listings_status_published_idx on public.listings (status, published_at desc);
create index if not exists listings_seller_idx on public.listings (seller_id, updated_at desc);
create index if not exists listings_categories_idx on public.listings using gin (categories);
create index if not exists listings_search_idx on public.listings using gin (search_vector);

-- Each machine inside a listing (exactly one for a single machine).
create table if not exists public.listing_items (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid not null references public.listings (id) on delete cascade,
  position       int not null default 0,
  category       text not null default '',
  manufacturer   text not null default '',
  model          text not null default '',
  year           int,
  condition      text not null default 'used' check (condition in ('new', 'used', 'refurbished')),
  running_status text check (running_status in ('running', 'not_running')),
  status_note    text,
  specs          jsonb not null default '[]'::jsonb,   -- [{"label": "Max sheet size", "value": "720 x 1020 mm"}]
  extras         text,
  created_at     timestamptz not null default now()
);

create index if not exists listing_items_listing_idx on public.listing_items (listing_id, position);

-- Photos, uploaded videos and video links.
create table if not exists public.listing_media (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  kind         text not null check (kind in ('image', 'video', 'video_link')),
  storage_path text,
  thumb_path   text,
  url          text,
  caption      text,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists listing_media_listing_idx on public.listing_media (listing_id, position);

-- History of every status change (submitted, approved, changes requested …).
create table if not exists public.listing_events (
  id         bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists listing_events_listing_idx on public.listing_events (listing_id, created_at desc);
create index if not exists listing_events_created_idx on public.listing_events (created_at desc);

-- Buyer inquiries. Kept as the record of which buyers Ware Print introduced.
create table if not exists public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.listings (id) on delete cascade,
  seller_id     uuid not null references public.profiles (id) on delete cascade,
  buyer_name    text not null,
  buyer_company text,
  buyer_email   text not null,
  buyer_phone   text not null,
  buyer_city    text,
  buyer_country text,
  topics        text[] not null default '{}',
  message       text not null,
  status        text not null default 'new' check (status in ('new', 'replied', 'closed')),
  ip_hash       text,
  email_sent_at timestamptz,
  sms_sent_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists inquiries_seller_idx on public.inquiries (seller_id, created_at desc);
create index if not exists inquiries_listing_idx on public.inquiries (listing_id, created_at desc);
create index if not exists inquiries_ip_idx on public.inquiries (ip_hash, created_at desc);

-- Signed seller oath / commission agreements (full text kept for the record).
create table if not exists public.seller_agreements (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references public.profiles (id) on delete cascade,
  version        text not null,
  agreement_text text not null,
  signed_name    text not null,
  company_name   text not null,
  ip_address     text,
  user_agent     text,
  signed_at      timestamptz not null default now()
);

create index if not exists seller_agreements_seller_idx on public.seller_agreements (seller_id, signed_at desc);

-- One-time phone verification codes (only the server can read these).
create table if not exists public.phone_otps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  phone       text not null,
  code_hash   text not null,
  attempts    int not null default 0,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists phone_otps_user_idx on public.phone_otps (user_id, created_at desc);

-- Sales reported by sellers, with the 2% commission owed to Ware Print.
create table if not exists public.sales (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.listings (id) on delete cascade,
  seller_id         uuid not null references public.profiles (id) on delete cascade,
  sold_via_wareprint boolean not null,
  sale_price        numeric(14, 2),
  currency          text not null default 'PKR',
  commission_rate   numeric(5, 4) not null default 0.02,
  commission_amount numeric(14, 2),
  commission_status text not null default 'due'
                    check (commission_status in ('due', 'invoiced', 'paid', 'waived', 'not_applicable')),
  buyer_name        text,
  notes             text,
  admin_note        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists sales_status_idx on public.sales (commission_status, created_at desc);
create index if not exists sales_seller_idx on public.sales (seller_id, created_at desc);


-- ---------------------------------------------------------------------
-- 2. Housekeeping triggers
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

drop trigger if exists sales_updated_at on public.sales;
create trigger sales_updated_at before update on public.sales
  for each row execute function public.set_updated_at();

-- Create the profile + company rows when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Sign-up details come from the user, so lengths are capped here as well as in the form.
  insert into public.profiles (id, email, email_confirmed_at, full_name, contact_email, phone_pending)
  values (
    new.id,
    coalesce(new.email, ''),
    new.email_confirmed_at,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''), 100),
    new.email,
    left(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 20)
  )
  on conflict (id) do nothing;

  insert into public.companies (id, name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), ''), 120))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the email + confirmation date in sync with Supabase Auth.
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set email = coalesce(new.email, email),
         email_confirmed_at = new.email_confirmed_at
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated after update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_user_updated();


-- ---------------------------------------------------------------------
-- 3. Row level security (who can read what)
-- ---------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.companies         enable row level security;
alter table public.listings          enable row level security;
alter table public.listing_items     enable row level security;
alter table public.listing_media     enable row level security;
alter table public.listing_events    enable row level security;
alter table public.inquiries         enable row level security;
alter table public.seller_agreements enable row level security;
alter table public.phone_otps        enable row level security;
alter table public.sales             enable row level security;

drop policy if exists "profiles: owner can read" on public.profiles;
create policy "profiles: owner can read" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "companies: anyone can read" on public.companies;
create policy "companies: anyone can read" on public.companies
  for select to anon, authenticated
  using (true);

drop policy if exists "listings: anyone can read live listings" on public.listings;
create policy "listings: anyone can read live listings" on public.listings
  for select to anon, authenticated
  using (
    status in ('published', 'sold')
    and exists (
      select 1 from public.companies c
      where c.id = listings.seller_id and not c.is_suspended
    )
  );

drop policy if exists "listings: owner can read own" on public.listings;
create policy "listings: owner can read own" on public.listings
  for select to authenticated
  using ((select auth.uid()) = seller_id);

-- Items and media are readable whenever their listing is readable.
drop policy if exists "listing_items: readable with listing" on public.listing_items;
create policy "listing_items: readable with listing" on public.listing_items
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_items.listing_id));

drop policy if exists "listing_media: readable with listing" on public.listing_media;
create policy "listing_media: readable with listing" on public.listing_media
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_media.listing_id));

drop policy if exists "listing_events: owner can read" on public.listing_events;
create policy "listing_events: owner can read" on public.listing_events
  for select to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_events.listing_id and l.seller_id = (select auth.uid())
  ));

drop policy if exists "inquiries: seller can read" on public.inquiries;
create policy "inquiries: seller can read" on public.inquiries
  for select to authenticated
  using ((select auth.uid()) = seller_id);

drop policy if exists "seller_agreements: owner can read" on public.seller_agreements;
create policy "seller_agreements: owner can read" on public.seller_agreements
  for select to authenticated
  using ((select auth.uid()) = seller_id);

drop policy if exists "sales: owner can read" on public.sales;
create policy "sales: owner can read" on public.sales
  for select to authenticated
  using ((select auth.uid()) = seller_id);

-- phone_otps has no policies on purpose: only the server can touch it.

-- Table privileges: browsers may only read; the server (service_role) does all writes.
grant usage on schema public to anon, authenticated, service_role;

revoke insert, update, delete, truncate on
  public.profiles, public.companies, public.listings, public.listing_items, public.listing_media,
  public.listing_events, public.inquiries, public.seller_agreements, public.phone_otps, public.sales
  from anon, authenticated;
revoke select on public.phone_otps from anon, authenticated;

grant select on public.companies, public.listings, public.listing_items, public.listing_media to anon, authenticated;
grant select on public.profiles, public.listing_events, public.inquiries, public.seller_agreements, public.sales to authenticated;

grant all on
  public.profiles, public.companies, public.listings, public.listing_items, public.listing_media,
  public.listing_events, public.inquiries, public.seller_agreements, public.phone_otps, public.sales
  to service_role;
grant usage, select on sequence public.listing_ref_seq to service_role;
grant usage, select on all sequences in schema public to service_role;


-- ---------------------------------------------------------------------
-- 4. Functions used by the website
-- ---------------------------------------------------------------------

-- Search published listings with filters. Respects row level security.
create or replace function public.search_listings(
  p_q          text    default null,
  p_category   text    default null,
  p_kind       text    default null,
  p_condition  text    default null,
  p_running    text    default null,
  p_city       text    default null,
  p_country    text    default null,
  p_year_min   int     default null,
  p_year_max   int     default null,
  p_with_price boolean default false,
  p_seller     uuid    default null,
  p_sort       text    default 'newest',
  p_limit      int     default 24,
  p_offset     int     default 0
)
returns table (
  id                 uuid,
  ref                bigint,
  slug               text,
  title              text,
  kind               text,
  primary_category   text,
  categories         text[],
  manufacturer       text,
  model              text,
  year               int,
  condition          text,
  operational_status text,
  item_count         int,
  price_type         text,
  price_amount       numeric,
  price_currency     text,
  city               text,
  country            text,
  cover_thumb_path   text,
  published_at       timestamptz,
  seller_id          uuid,
  seller_name        text,
  seller_verified    boolean,
  total_count        bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.id, l.ref, l.slug, l.title, l.kind, l.primary_category, l.categories,
    l.manufacturer, l.model, l.year, l.condition, l.operational_status, l.item_count,
    l.price_type, l.price_amount, l.price_currency, l.city, l.country,
    l.cover_thumb_path, l.published_at, l.seller_id, c.name, (c.verified_at is not null),
    count(*) over ()
  from public.listings l
  join public.companies c on c.id = l.seller_id
  where l.status = 'published'
    and not c.is_suspended
    and (coalesce(p_q, '') = ''
         or l.search_vector @@ websearch_to_tsquery('english', p_q)
         or l.search_text ilike '%' || p_q || '%')
    and (coalesce(p_category, '') = '' or l.categories @> array[p_category])
    and (coalesce(p_kind, '') = '' or l.kind = p_kind)
    and (coalesce(p_condition, '') = '' or l.condition = p_condition)
    and (coalesce(p_running, '') = '' or l.operational_status = p_running)
    and (coalesce(p_city, '') = '' or lower(l.city) = lower(p_city))
    and (coalesce(p_country, '') = '' or lower(l.country) = lower(p_country))
    and (p_year_min is null or l.year >= p_year_min)
    and (p_year_max is null or l.year <= p_year_max)
    and (not coalesce(p_with_price, false) or l.price_type <> 'on_request')
    and (p_seller is null or l.seller_id = p_seller)
  order by
    case when p_sort = 'year_desc' then l.year end desc nulls last,
    case when p_sort = 'year_asc' then l.year end asc nulls last,
    case when p_sort = 'relevance' and coalesce(p_q, '') <> ''
         then ts_rank(l.search_vector, websearch_to_tsquery('english', p_q)) end desc nulls last,
    l.published_at desc nulls last,
    l.ref desc
  limit greatest(1, least(coalesce(p_limit, 24), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- Counts for the filter sidebar and home page.
create or replace function public.listing_facets()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with pub as (
    select l.*
    from public.listings l
    join public.companies c on c.id = l.seller_id
    where l.status = 'published' and not c.is_suspended
  )
  select jsonb_build_object(
    'total',      (select count(*) from pub),
    'sellers',    (select count(distinct seller_id) from pub),
    'categories', coalesce((select jsonb_object_agg(cat, n)
                              from (select unnest(categories) as cat, count(*) as n from pub group by 1) s), '{}'::jsonb),
    'kinds',      coalesce((select jsonb_object_agg(kind, n)
                              from (select kind, count(*) as n from pub group by 1) s), '{}'::jsonb),
    'running',    coalesce((select jsonb_object_agg(operational_status, n)
                              from (select operational_status, count(*) as n from pub
                                     where operational_status is not null group by 1) s), '{}'::jsonb),
    'conditions', coalesce((select jsonb_object_agg(condition, n)
                              from (select condition, count(*) as n from pub
                                     where condition is not null group by 1) s), '{}'::jsonb),
    'cities',     coalesce((select jsonb_agg(jsonb_build_object('name', city, 'n', n) order by n desc, city)
                              from (select city, count(*) as n from pub where city <> '' group by city) s), '[]'::jsonb),
    'countries',  coalesce((select jsonb_agg(jsonb_build_object('name', country, 'n', n) order by n desc, country)
                              from (select country, count(*) as n from pub where country <> '' group by country) s), '[]'::jsonb)
  );
$$;

-- Used by storage rules: may this user upload photos/videos?
create or replace function public.can_upload_media()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.companies c on c.id = p.id
    where p.id = (select auth.uid())
      and p.phone_verified_at is not null
      and not c.is_suspended
  );
$$;

-- Saves a listing with its machines and media in one transaction (server only).
create or replace function public.save_listing(p_listing jsonb, p_items jsonb, p_media jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := (p_listing ->> 'id')::uuid;
  r public.listings;
begin
  r := jsonb_populate_record(null::public.listings, p_listing);

  if exists (select 1 from public.listings where id = v_id) then
    update public.listings set
      status                    = r.status,
      kind                      = r.kind,
      title                     = r.title,
      slug                      = r.slug,
      primary_category          = r.primary_category,
      categories                = r.categories,
      description               = r.description,
      manufacturer              = r.manufacturer,
      model                     = r.model,
      year                      = r.year,
      condition                 = r.condition,
      operational_status        = r.operational_status,
      item_count                = r.item_count,
      price_type                = r.price_type,
      price_amount              = r.price_amount,
      price_currency            = r.price_currency,
      city                      = r.city,
      country                   = r.country,
      availability              = r.availability,
      inspection_available      = r.inspection_available,
      loading_assistance        = r.loading_assistance,
      cover_path                = r.cover_path,
      cover_thumb_path          = r.cover_thumb_path,
      search_text               = r.search_text,
      authenticity_confirmed_at = r.authenticity_confirmed_at,
      submitted_at              = r.submitted_at
    where id = v_id;
  else
    insert into public.listings (
      id, seller_id, status, kind, title, slug, primary_category, categories, description,
      manufacturer, model, year, condition, operational_status, item_count,
      price_type, price_amount, price_currency, city, country, availability,
      inspection_available, loading_assistance, cover_path, cover_thumb_path, search_text,
      authenticity_confirmed_at, submitted_at
    ) values (
      v_id, r.seller_id, r.status, r.kind, r.title, r.slug, r.primary_category, r.categories, r.description,
      r.manufacturer, r.model, r.year, r.condition, r.operational_status, r.item_count,
      r.price_type, r.price_amount, r.price_currency, r.city, r.country, r.availability,
      r.inspection_available, r.loading_assistance, r.cover_path, r.cover_thumb_path, r.search_text,
      r.authenticity_confirmed_at, r.submitted_at
    );
  end if;

  delete from public.listing_items where listing_id = v_id;
  insert into public.listing_items (
    listing_id, position, category, manufacturer, model, year, condition, running_status, status_note, specs, extras
  )
  select v_id, x.position, x.category, x.manufacturer, x.model, x.year, x.condition,
         x.running_status, x.status_note, coalesce(x.specs, '[]'::jsonb), x.extras
  from jsonb_populate_recordset(null::public.listing_items, coalesce(p_items, '[]'::jsonb)) x;

  delete from public.listing_media where listing_id = v_id;
  insert into public.listing_media (id, listing_id, kind, storage_path, thumb_path, url, caption, position)
  select coalesce(x.id, gen_random_uuid()), v_id, x.kind, x.storage_path, x.thumb_path, x.url, x.caption, x.position
  from jsonb_populate_recordset(null::public.listing_media, coalesce(p_media, '[]'::jsonb)) x;
end;
$$;

create or replace function public.increment_listing_views(p_listing uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.listings set view_count = view_count + 1
  where id = p_listing and status = 'published';
$$;

-- Lock down function access: browsers may only call the read-only search helpers.
revoke execute on function public.save_listing(jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.increment_listing_views(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_updated() from public, anon, authenticated;
grant execute on function public.save_listing(jsonb, jsonb, jsonb) to service_role;
grant execute on function public.increment_listing_views(uuid) to service_role;
grant execute on function public.search_listings(text, text, text, text, text, text, text, int, int, boolean, uuid, text, int, int)
  to anon, authenticated, service_role;
grant execute on function public.listing_facets() to anon, authenticated, service_role;
grant execute on function public.can_upload_media() to authenticated, service_role;


-- ---------------------------------------------------------------------
-- 5. File storage for photos and videos
-- ---------------------------------------------------------------------

-- Public bucket: files are readable by URL. 50 MB per file (Supabase free-plan maximum).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media', 'listing-media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Verified sellers may upload into their own folder: <user id>/...
drop policy if exists "listing-media: verified sellers upload to own folder" on storage.objects;
create policy "listing-media: verified sellers upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.can_upload_media()
  );

drop policy if exists "listing-media: sellers read own folder" on storage.objects;
create policy "listing-media: sellers read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "listing-media: sellers delete own files" on storage.objects;
create policy "listing-media: sellers delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-media' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- ---------------------------------------------------------------------
-- 6. Accounts created before this script ran (safe to re-run)
-- ---------------------------------------------------------------------

insert into public.profiles (id, email, email_confirmed_at, full_name, contact_email, phone_pending)
select u.id, coalesce(u.email, ''), u.email_confirmed_at,
       coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), ''),
       u.email, nullif(trim(u.raw_user_meta_data ->> 'phone'), '')
from auth.users u
on conflict (id) do nothing;

insert into public.companies (id, name)
select u.id, coalesce(nullif(trim(u.raw_user_meta_data ->> 'company_name'), ''), '')
from auth.users u
on conflict (id) do nothing;

-- Done. Next step in SETUP-GUIDE.md: make yourself an admin with make-admin.sql.
