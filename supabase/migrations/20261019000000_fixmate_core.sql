create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('customer', 'landlord', 'technician', 'admin');
create type public.booking_status as enum (
  'requested',
  'awaiting_approval',
  'confirmed',
  'technician_assigned',
  'technician_en_route',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  phone text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'ar')),
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Profile roles can only be changed by a privileged server operation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger protect_profile_role_before_update
before update on public.profiles
for each row execute function public.protect_profile_role();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_phone text;
begin
  v_display_name := trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  v_phone := nullif(new.raw_user_meta_data ->> 'phone', '');
  if char_length(v_display_name) not between 2 and 120 then
    raise exception 'Enter a name with 2 to 120 characters';
  end if;
  if v_phone is not null and v_phone !~ '^\+9715[0-9]{8}$' then
    raise exception 'Enter a valid UAE mobile number';
  end if;
  insert into public.profiles (id, display_name, phone)
  values (
    new.id,
    v_display_name,
    v_phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_ar text not null,
  sort_order integer not null default 0,
  enabled boolean not null default true
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  emirate text not null,
  area text not null,
  enabled boolean not null default true,
  unique (emirate, area)
);

create table public.services (
  id uuid primary key,
  category_id uuid references public.service_categories(id),
  name text not null,
  name_ar text not null,
  description text not null default '',
  base_price_aed numeric(10, 2) not null check (base_price_aed >= 0),
  duration_minutes integer not null default 120 check (duration_minutes between 15 and 720),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  emirate text not null,
  area text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_members (
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('landlord', 'manager', 'tenant')),
  created_at timestamptz not null default now(),
  primary key (property_id, user_id)
);

create function public.is_property_member(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.properties p
    where p.id = p_property_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.property_members pm
    where pm.property_id = p_property_id and pm.user_id = auth.uid()
  );
$$;

create function public.is_property_manager(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.properties p
    where p.id = p_property_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.property_members pm
    where pm.property_id = p_property_id and pm.user_id = auth.uid()
      and pm.member_role in ('landlord', 'manager')
  );
$$;

create table public.technician_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  bio text not null default '',
  verification_status text not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  available boolean not null default false,
  rating numeric(3, 2) check (rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.technician_services (
  technician_id uuid not null references public.technician_profiles(profile_id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (technician_id, service_id)
);

create table public.technician_areas (
  technician_id uuid not null references public.technician_profiles(profile_id) on delete cascade,
  service_area_id uuid not null references public.service_areas(id) on delete cascade,
  primary key (technician_id, service_area_id)
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles(profile_id) on delete cascade,
  document_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid not null references public.profiles(id),
  property_id uuid references public.properties(id),
  service_id uuid not null references public.services(id),
  assigned_technician_id uuid references public.technician_profiles(profile_id),
  problem_description text not null check (char_length(problem_description) between 10 and 1200),
  emirate text not null,
  area text not null,
  address text not null,
  scheduled_at timestamptz not null,
  status public.booking_status not null default 'requested',
  estimated_price_aed numeric(10, 2) not null check (estimated_price_aed >= 0),
  final_price_aed numeric(10, 2) check (final_price_aed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_customer_created_idx on public.bookings (customer_id, created_at desc);
create index bookings_technician_schedule_idx on public.bookings (assigned_technician_id, scheduled_at)
  where assigned_technician_id is not null;
create index bookings_status_schedule_idx on public.bookings (status, scheduled_at);

create table public.technician_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(profile_id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique (booking_id, technician_id)
);

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  previous_status public.booking_status,
  new_status public.booking_status not null,
  actor_id uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  total_aed numeric(10, 2) not null check (total_aed >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decision_by uuid references public.profiles(id),
  decision_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  description text not null,
  quantity numeric(8, 2) not null check (quantity > 0),
  unit_price_aed numeric(10, 2) not null check (unit_price_aed >= 0)
);

create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  storage_path text not null unique,
  photo_type text not null check (photo_type in ('customer_issue', 'before', 'after')),
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  invoice_number text not null unique,
  total_aed numeric(10, 2) not null check (total_aed >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'void', 'refunded')),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  provider text not null,
  provider_reference text unique,
  amount_aed numeric(10, 2) not null check (amount_aed >= 0),
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  customer_id uuid not null references public.profiles(id),
  technician_id uuid not null references public.technician_profiles(profile_id),
  rating integer not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1200),
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  customer_id uuid not null references public.profiles(id),
  description text not null check (char_length(description) between 10 and 3000),
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'closed')),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  title text not null,
  title_ar text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  enabled boolean not null default false,
  check (ends_at > starts_at)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function public.request_booking(
  p_service_id uuid,
  p_problem_description text,
  p_emirate text,
  p_area text,
  p_address text,
  p_scheduled_date date,
  p_time_window text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_service public.services%rowtype;
  v_start_time time;
  v_scheduled_at timestamptz;
  v_booking public.bookings%rowtype;
begin
  if v_customer_id is null then
    raise exception 'Sign in before requesting a booking';
  end if;
  if p_emirate not in ('Ajman', 'Sharjah') then
    raise exception 'Service is not available in this emirate';
  end if;
  if length(trim(p_area)) < 2 or length(trim(p_address)) < 8 then
    raise exception 'Provide a valid service address';
  end if;
  if length(trim(p_problem_description)) not between 10 and 1200 then
    raise exception 'Describe the problem in 10 to 1200 characters';
  end if;
  v_start_time := case p_time_window
    when 'morning' then time '09:00'
    when 'afternoon' then time '13:00'
    when 'evening' then time '17:00'
    else null
  end;
  if v_start_time is null then
    raise exception 'Choose a valid appointment window';
  end if;
  v_scheduled_at := (p_scheduled_date + v_start_time) at time zone 'Asia/Dubai';
  if v_scheduled_at <= now() then
    raise exception 'Choose a future appointment time';
  end if;
  select * into v_service
  from public.services
  where id = p_service_id and enabled;
  if not found then
    raise exception 'Selected service is unavailable';
  end if;
  if not exists (
    select 1 from public.service_areas
    where emirate = p_emirate and area = trim(p_area) and enabled
  ) then
    raise exception 'Service is not available in this area';
  end if;
  insert into public.bookings (
    reference, customer_id, service_id, problem_description, emirate,
    area, address, scheduled_at, estimated_price_aed
  )
  values (
    'FM-' || upper(substr(pg_catalog.gen_random_uuid()::text, 1, 8)),
    v_customer_id,
    v_service.id,
    trim(p_problem_description),
    p_emirate,
    trim(p_area),
    trim(p_address),
    v_scheduled_at,
    v_service.base_price_aed
  )
  returning * into v_booking;
  insert into public.booking_status_history (booking_id, new_status, actor_id)
  values (v_booking.id, 'requested', v_customer_id);
  return v_booking.reference;
end;
$$;

create function public.technician_update_booking_status(p_booking_id uuid, p_new_status public.booking_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking from public.bookings
  where id = p_booking_id and assigned_technician_id = auth.uid()
  for update;
  if not found then
    raise exception 'Job not found or not assigned to this technician';
  end if;
  if not (
    (v_booking.status = 'technician_assigned' and p_new_status = 'technician_en_route')
    or (v_booking.status = 'technician_en_route' and p_new_status = 'in_progress')
    or (v_booking.status = 'in_progress' and p_new_status = 'completed')
  ) then
    raise exception 'Invalid booking status transition';
  end if;
  update public.bookings
  set status = p_new_status,
      final_price_aed = case when p_new_status = 'completed' then coalesce(final_price_aed, estimated_price_aed) else final_price_aed end,
      updated_at = now()
  where id = p_booking_id;
  insert into public.booking_status_history (booking_id, previous_status, new_status, actor_id)
  values (p_booking_id, v_booking.status, p_new_status, auth.uid());
end;
$$;

create function public.review_quotation(p_quotation_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quotation public.quotations%rowtype;
  v_booking public.bookings%rowtype;
  v_next_status public.booking_status;
begin
  select q.* into v_quotation
  from public.quotations q
  join public.bookings b on b.id = q.booking_id
  where q.id = p_quotation_id
    and (
      b.customer_id = auth.uid()
      or exists (
        select 1 from public.properties p
        where p.id = b.property_id and p.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.property_members pm
        where pm.property_id = b.property_id and pm.user_id = auth.uid()
          and pm.member_role in ('landlord', 'manager')
      )
    )
  for update of q;
  if not found or v_quotation.status <> 'pending' then
    raise exception 'Quotation not found or already decided';
  end if;
  select * into v_booking from public.bookings where id = v_quotation.booking_id for update;
  if v_booking.status not in ('awaiting_approval', 'in_progress') then
    raise exception 'Quotation cannot be decided in the current booking status';
  end if;
  update public.quotations
  set status = case when p_approve then 'approved' else 'rejected' end,
      decision_by = auth.uid(),
      decision_at = now()
  where id = p_quotation_id;
  if p_approve then
    v_next_status := case
      when v_booking.status = 'awaiting_approval' and v_booking.assigned_technician_id is null then 'confirmed'::public.booking_status
      when v_booking.status = 'awaiting_approval' then 'technician_assigned'::public.booking_status
      else v_booking.status
    end;
    update public.bookings
    set final_price_aed = v_quotation.total_aed, status = v_next_status, updated_at = now()
    where id = v_booking.id;
  elsif v_booking.status = 'awaiting_approval' then
    v_next_status := 'cancelled';
    update public.bookings set status = v_next_status, updated_at = now() where id = v_booking.id;
  else
    v_next_status := v_booking.status;
  end if;
  insert into public.booking_status_history (booking_id, previous_status, new_status, actor_id, note)
  values (
    v_booking.id,
    v_booking.status,
    v_next_status,
    auth.uid(),
    case when p_approve then 'Quotation approved' else 'Quotation rejected' end
  );
end;
$$;

create view public.admin_technician_candidates
as
select t.profile_id as technician_id,
       p.display_name,
       t.bio,
       t.rating,
       array_agg(distinct ts.service_id) filter (where ts.service_id is not null) as service_ids,
       array_agg(distinct sa.emirate || '/' || sa.area) filter (where sa.id is not null) as service_areas
from public.technician_profiles t
join public.profiles p on p.id = t.profile_id
left join public.technician_services ts on ts.technician_id = t.profile_id
left join public.technician_areas ta on ta.technician_id = t.profile_id
left join public.service_areas sa on sa.id = ta.service_area_id
where t.verification_status = 'approved'
  and t.available
  and exists (select 1 from public.profiles admin_profile where admin_profile.id = auth.uid() and admin_profile.role = 'admin')
group by t.profile_id, p.display_name, t.bio, t.rating;

create function public.admin_assign_technician(p_booking_id uuid, p_technician_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_duration_minutes integer;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Administrator access is required';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and status in ('requested', 'confirmed')
  for update;
  if not found then
    raise exception 'Booking is not available for assignment';
  end if;
  select duration_minutes into v_duration_minutes
  from public.services where id = v_booking.service_id;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_technician_id::text)::bigint);
  if not exists (
    select 1
    from public.technician_profiles t
    join public.technician_services ts on ts.technician_id = t.profile_id
    join public.technician_areas ta on ta.technician_id = t.profile_id
    join public.service_areas sa on sa.id = ta.service_area_id
    where t.profile_id = p_technician_id
      and t.verification_status = 'approved'
      and t.available
      and ts.service_id = v_booking.service_id
      and sa.emirate = v_booking.emirate
      and sa.area = v_booking.area
  ) then
    raise exception 'Technician is not approved, available, or qualified for this job';
  end if;

  if exists (
    select 1 from public.bookings b
    join public.services existing_service on existing_service.id = b.service_id
    where b.assigned_technician_id = p_technician_id
      and b.status not in ('completed', 'cancelled', 'disputed')
      and tstzrange(b.scheduled_at, b.scheduled_at + pg_catalog.make_interval(mins => existing_service.duration_minutes), '[)')
          && tstzrange(v_booking.scheduled_at, v_booking.scheduled_at + pg_catalog.make_interval(mins => v_duration_minutes), '[)')
  ) then
    raise exception 'Technician already has a job during that time';
  end if;

  update public.bookings
  set assigned_technician_id = p_technician_id,
      status = 'technician_assigned',
      updated_at = now()
  where id = p_booking_id;
  insert into public.technician_assignments (booking_id, technician_id, assigned_by)
  values (p_booking_id, p_technician_id, auth.uid());
  insert into public.booking_status_history (booking_id, previous_status, new_status, actor_id, note)
  values (p_booking_id, v_booking.status, 'technician_assigned', auth.uid(), 'Technician assigned by administrator');
  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'technician_assigned', 'booking', p_booking_id);
end;
$$;

create view public.booking_summaries
with (security_invoker = true)
as
select b.id, b.reference, b.status, b.scheduled_at, b.created_at,
       s.name as service_name, b.estimated_price_aed, b.final_price_aed
from public.bookings b
join public.services s on s.id = b.service_id;

create view public.technician_public_ratings
as
select technician_id,
       round(avg(rating)::numeric, 2) as average_rating,
       count(*)::integer as review_count
from public.reviews
group by technician_id;

alter table public.profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_areas enable row level security;
alter table public.services enable row level security;
alter table public.properties enable row level security;
alter table public.property_members enable row level security;
alter table public.technician_profiles enable row level security;
alter table public.technician_services enable row level security;
alter table public.technician_areas enable row level security;
alter table public.verification_records enable row level security;
alter table public.bookings enable row level security;
alter table public.technician_assignments enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.job_photos enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.complaints enable row level security;
alter table public.notifications enable row level security;
alter table public.promotions enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Users can update non-role profile fields" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (display_name, phone, preferred_language, updated_at) on public.profiles to authenticated;

create policy "Enabled catalog categories are public" on public.service_categories for select to anon, authenticated using (enabled);
create policy "Enabled areas are public" on public.service_areas for select to anon, authenticated using (enabled);
create policy "Enabled services are public" on public.services for select to anon, authenticated using (enabled);
create policy "Enabled promotions are public" on public.promotions for select to anon, authenticated using (enabled and starts_at <= now() and ends_at > now());

create policy "Property owners and members can read properties" on public.properties for select to authenticated using (owner_id = auth.uid() or public.is_property_member(id));
create policy "Customers and landlords can create own properties" on public.properties for insert to authenticated with check (owner_id = auth.uid());
create policy "Property owners can update properties" on public.properties for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners and managers can view property relationships" on public.property_members for select to authenticated using (user_id = auth.uid() or public.is_property_manager(property_id));

create policy "Technicians see own and approved public profiles" on public.technician_profiles for select to authenticated using (profile_id = auth.uid() or verification_status = 'approved');
create policy "Technicians see public skills" on public.technician_services for select to authenticated using (
  exists (select 1 from public.technician_profiles t where t.profile_id = technician_id and (t.profile_id = auth.uid() or t.verification_status = 'approved'))
);
create policy "Technicians see public areas" on public.technician_areas for select to authenticated using (
  exists (select 1 from public.technician_profiles t where t.profile_id = technician_id and (t.profile_id = auth.uid() or t.verification_status = 'approved'))
);
create policy "Technicians and admins can review verification records" on public.verification_records for select to authenticated using (
  technician_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "Customers, assigned technicians and property members can read bookings" on public.bookings for select to authenticated using (
  customer_id = auth.uid()
  or assigned_technician_id = auth.uid()
  or (property_id is not null and public.is_property_member(property_id))
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Participants can read technician assignments" on public.technician_assignments for select to authenticated using (
  technician_id = auth.uid()
  or exists (select 1 from public.bookings b where b.id = booking_id and (b.customer_id = auth.uid() or (b.property_id is not null and public.is_property_member(b.property_id))))
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Participants can read booking history" on public.booking_status_history for select to authenticated using (
  exists (select 1 from public.bookings b where b.id = booking_id and (
    b.customer_id = auth.uid() or b.assigned_technician_id = auth.uid()
    or (b.property_id is not null and public.is_property_member(b.property_id))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ))
);
create policy "Participants can read quotations" on public.quotations for select to authenticated using (
  exists (select 1 from public.bookings b where b.id = booking_id and (
    b.customer_id = auth.uid() or b.assigned_technician_id = auth.uid()
    or (b.property_id is not null and public.is_property_manager(b.property_id))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ))
);
create policy "Participants can read quotation items" on public.quotation_items for select to authenticated using (
  exists (select 1 from public.quotations q join public.bookings b on b.id = q.booking_id where q.id = quotation_id and (
    b.customer_id = auth.uid() or b.assigned_technician_id = auth.uid()
    or (b.property_id is not null and public.is_property_manager(b.property_id))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ))
);
create policy "Booking participants can read job photos" on public.job_photos for select to authenticated using (
  exists (select 1 from public.bookings b where b.id = booking_id and (
    b.customer_id = auth.uid() or b.assigned_technician_id = auth.uid()
    or (b.property_id is not null and public.is_property_member(b.property_id))
  ))
);
create policy "Customers, property managers and admins can read invoices" on public.invoices for select to authenticated using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
  or exists (select 1 from public.bookings b where b.id = booking_id and b.property_id is not null and public.is_property_manager(b.property_id))
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Customers, property managers and admins can read payments" on public.payments for select to authenticated using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
  or exists (select 1 from public.bookings b where b.id = booking_id and b.property_id is not null and public.is_property_manager(b.property_id))
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Customers can read own reviews" on public.reviews for select to authenticated using (
  customer_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Customers can read own complaints" on public.complaints for select to authenticated using (
  customer_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Users can read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Administrators can read audit logs" on public.audit_logs for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-media', 'booking-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Booking participants can view private booking media"
on storage.objects for select to authenticated
using (
  bucket_id = 'booking-media'
  and exists (
    select 1 from public.bookings b
    where b.id::text = (storage.foldername(name))[1]
      and (
        b.customer_id = auth.uid()
        or b.assigned_technician_id = auth.uid()
        or (b.property_id is not null and public.is_property_member(b.property_id))
      )
  )
);

create policy "Booking participants can upload their own media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'booking-media'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1 from public.bookings b
    where b.id::text = (storage.foldername(name))[1]
      and (
        (b.customer_id = auth.uid() and (storage.foldername(name))[3] = 'customer_issue')
        or (
          b.assigned_technician_id = auth.uid()
          and (storage.foldername(name))[3] in ('before', 'after')
        )
      )
  )
);

grant select on public.service_categories, public.service_areas, public.services, public.promotions to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.properties, public.property_members, public.technician_profiles, public.technician_services,
  public.technician_areas, public.verification_records, public.bookings, public.technician_assignments,
  public.booking_status_history, public.quotations, public.quotation_items, public.job_photos, public.invoices,
  public.payments, public.reviews, public.complaints, public.notifications, public.audit_logs to authenticated;
grant select on public.booking_summaries to authenticated;
grant select on public.technician_public_ratings to anon, authenticated;
revoke all on public.booking_summaries from public, anon;
revoke all on public.admin_technician_candidates from public, anon;
grant select on public.admin_technician_candidates to authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_property_member(uuid) from public, anon;
grant execute on function public.is_property_member(uuid) to authenticated;
revoke all on function public.is_property_manager(uuid) from public, anon;
grant execute on function public.is_property_manager(uuid) to authenticated;
revoke all on function public.request_booking(uuid, text, text, text, text, date, text) from public, anon;
revoke all on function public.technician_update_booking_status(uuid, public.booking_status) from public, anon;
revoke all on function public.review_quotation(uuid, boolean) from public, anon;
revoke all on function public.admin_assign_technician(uuid, uuid) from public, anon;
grant execute on function public.request_booking(uuid, text, text, text, text, date, text) to authenticated;
grant execute on function public.technician_update_booking_status(uuid, public.booking_status) to authenticated;
grant execute on function public.review_quotation(uuid, boolean) to authenticated;
grant execute on function public.admin_assign_technician(uuid, uuid) to authenticated;

insert into public.service_categories (name, name_ar, sort_order) values
  ('Air conditioning', 'التكييف', 1),
  ('Plumbing', 'السباكة', 2),
  ('Electrical', 'الكهرباء', 3),
  ('Home care', 'العناية بالمنزل', 4)
on conflict (name) do nothing;

insert into public.service_areas (emirate, area) values
  ('Ajman', 'Al Nuaimia'),
  ('Ajman', 'Al Rashidiya'),
  ('Ajman', 'Al Jurf'),
  ('Sharjah', 'Al Majaz'),
  ('Sharjah', 'Al Nahda'),
  ('Sharjah', 'Muwaileh')
on conflict (emirate, area) do nothing;

insert into public.services (id, category_id, name, name_ar, description, base_price_aed) values
  ('10000000-0000-4000-8000-000000000001', (select id from public.service_categories where name = 'Air conditioning'), 'AC repair', 'صيانة التكييف', 'Cooling, servicing and repairs', 99),
  ('10000000-0000-4000-8000-000000000002', (select id from public.service_categories where name = 'Plumbing'), 'Plumbing', 'السباكة', 'Leaks, taps and drain care', 79),
  ('10000000-0000-4000-8000-000000000003', (select id from public.service_categories where name = 'Electrical'), 'Electrical repairs', 'إصلاحات الكهرباء', 'Safe home electrical work', 89),
  ('10000000-0000-4000-8000-000000000004', (select id from public.service_categories where name = 'Home care'), 'Handyman', 'خدمات الصيانة', 'Repairs and installations', 69),
  ('10000000-0000-4000-8000-000000000005', (select id from public.service_categories where name = 'Home care'), 'Appliance repair', 'إصلاح الأجهزة', 'Household appliance maintenance', 99),
  ('10000000-0000-4000-8000-000000000006', (select id from public.service_categories where name = 'Home care'), 'Painting', 'الدهان', 'Room and wall painting', 149),
  ('10000000-0000-4000-8000-000000000007', (select id from public.service_categories where name = 'Home care'), 'Deep cleaning', 'التنظيف العميق', 'Detailed home cleaning', 199),
  ('10000000-0000-4000-8000-000000000008', (select id from public.service_categories where name = 'Home care'), 'Water heater maintenance', 'صيانة سخان المياه', 'Inspection and maintenance', 99)
on conflict (id) do nothing;
