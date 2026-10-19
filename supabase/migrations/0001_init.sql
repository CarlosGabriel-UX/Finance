-- Finanças do Casal: esquema inicial
-- Cada pessoa tem seu login (auth.users). Contas e investimentos são "pessoais"
-- (owner_id preenchido) ou "do casal" (couple_id preenchido). O RLS garante que
-- cada pessoa vê apenas o que é dela e o que é do casal.

create extension if not exists pgcrypto;

-- Perfis ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Casal ----------------------------------------------------------------------
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nosso casal',
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples on delete cascade,
  user_id uuid not null unique references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.couple_members where user_id = auth.uid();
$$;

create or replace function public.can_access(p_owner uuid, p_couple uuid)
returns boolean
language sql
stable
as $$
  select (p_owner is not null and p_owner = auth.uid())
      or (p_couple is not null and p_couple = public.my_couple_id());
$$;

create or replace function public.create_couple(p_name text default 'Nosso casal')
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.couples;
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'você já faz parte de um casal';
  end if;
  insert into public.couples (name) values (coalesce(nullif(trim(p_name), ''), 'Nosso casal')) returning * into c;
  insert into public.couple_members (couple_id, user_id) values (c.id, auth.uid());
  return c;
end;
$$;

create or replace function public.join_couple(p_code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.couples;
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'você já faz parte de um casal';
  end if;
  select * into c from public.couples where invite_code = upper(trim(p_code));
  if c.id is null then
    raise exception 'código de convite inválido';
  end if;
  if (select count(*) from public.couple_members where couple_id = c.id) >= 2 then
    raise exception 'este casal já está completo';
  end if;
  insert into public.couple_members (couple_id, user_id) values (c.id, auth.uid());
  return c;
end;
$$;

-- Contas (cartões / contas bancárias) ----------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade,
  couple_id uuid references public.couples on delete cascade,
  name text not null,
  brand text not null default 'outro',
  last4 text,
  initial_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint accounts_scope check ((owner_id is null) <> (couple_id is null))
);

-- Transações: o escopo (pessoal ou casal) vem da conta.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts on delete cascade,
  created_by uuid default auth.uid() references auth.users on delete set null,
  description text not null,
  category text not null default 'outros',
  amount numeric(14, 2) not null, -- positivo = entrada, negativo = saída
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index transactions_account_date on public.transactions (account_id, occurred_at desc);

-- Investimentos --------------------------------------------------------------
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade,
  couple_id uuid references public.couples on delete cascade,
  created_by uuid default auth.uid() references auth.users on delete set null,
  kind text not null check (kind in ('renda_fixa', 'renda_variavel')),
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  invested_at date not null default current_date,
  created_at timestamptz not null default now(),
  constraint investments_scope check ((owner_id is null) <> (couple_id is null))
);

-- RLS ------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.investments enable row level security;

create policy "perfil próprio ou do par" on public.profiles for select
  using (id = auth.uid() or id in (select user_id from public.couple_members where couple_id = public.my_couple_id()));
create policy "editar perfil próprio" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "ver meu casal" on public.couples for select
  using (id = public.my_couple_id());
create policy "editar meu casal" on public.couples for update
  using (id = public.my_couple_id()) with check (id = public.my_couple_id());

create policy "ver membros do meu casal" on public.couple_members for select
  using (couple_id = public.my_couple_id());

create policy "contas acessíveis" on public.accounts for all
  using (public.can_access(owner_id, couple_id))
  with check (public.can_access(owner_id, couple_id));

create policy "transações acessíveis" on public.transactions for all
  using (exists (select 1 from public.accounts a where a.id = account_id and public.can_access(a.owner_id, a.couple_id)))
  with check (exists (select 1 from public.accounts a where a.id = account_id and public.can_access(a.owner_id, a.couple_id)));

create policy "investimentos acessíveis" on public.investments for all
  using (public.can_access(owner_id, couple_id))
  with check (public.can_access(owner_id, couple_id));
