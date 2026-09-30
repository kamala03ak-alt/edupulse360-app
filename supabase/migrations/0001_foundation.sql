-- EduPulse 360 technical foundation: identity, profiles, roles, and audit events.
-- Apply this migration in the Supabase SQL editor or through Supabase CLI migrations.

create type public.app_role as enum ('Admin', 'Manager', 'Sales', 'Trainer', 'Finance', 'Student');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'UTC',
  currency text not null default 'INR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  display_name text not null default '',
  email text,
  role public.app_role not null default 'Student',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index user_profiles_auth_user_id_idx on public.user_profiles(auth_user_id);
create index user_profiles_organization_id_idx on public.user_profiles(organization_id);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where auth_user_id = auth.uid()
      and role = 'Admin'
      and is_active = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (auth_user_id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.auth_user_id and not public.is_admin() then
    if new.role is distinct from old.role
      or new.organization_id is distinct from old.organization_id
      or new.is_active is distinct from old.is_active
      or new.auth_user_id is distinct from old.auth_user_id then
      raise exception 'Only an administrator can change profile access fields';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_privilege_fields
before update on public.user_profiles
for each row execute function public.prevent_profile_privilege_escalation();

alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.audit_logs enable row level security;

create policy "active users can view their organization"
on public.organizations for select
to authenticated
using (
  id in (select organization_id from public.user_profiles where auth_user_id = auth.uid() and is_active = true)
  or public.is_admin()
);

create policy "users can view their own profile or admins can view profiles"
on public.user_profiles for select
to authenticated
using (auth_user_id = auth.uid() or public.is_admin());

create policy "users can update their own non-privileged profile"
on public.user_profiles for update
to authenticated
using (auth_user_id = auth.uid() or public.is_admin())
with check (auth_user_id = auth.uid() or public.is_admin());

create policy "admins can insert profiles"
on public.user_profiles for insert
to authenticated
with check (public.is_admin() or auth_user_id = auth.uid());

create policy "admins can view audit logs"
on public.audit_logs for select
to authenticated
using (public.is_admin());

create policy "authenticated users can append their own audit events"
on public.audit_logs for insert
to authenticated
with check (actor_id = auth.uid());
