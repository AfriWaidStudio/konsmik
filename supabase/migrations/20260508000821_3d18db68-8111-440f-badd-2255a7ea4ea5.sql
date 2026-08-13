
-- Reaction kinds
do $$ begin
  create type public.reaction_kind as enum ('like','fire','insightful','support','genius','respect');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_priority as enum ('important','social','system');
exception when duplicate_object then null; end $$;

-- Post reactions (replaces simple likes for richer signals; likes table kept for backwards compat)
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  user_id uuid not null,
  kind public.reaction_kind not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, kind)
);
create index if not exists reactions_post_idx on public.reactions(post_id);
create index if not exists reactions_user_idx on public.reactions(user_id);
alter table public.reactions enable row level security;
drop policy if exists "Reactions viewable by everyone" on public.reactions;
create policy "Reactions viewable by everyone" on public.reactions for select using (true);
drop policy if exists "Users react as themselves" on public.reactions;
create policy "Users react as themselves" on public.reactions for insert with check (auth.uid() = user_id);
drop policy if exists "Users remove own reactions" on public.reactions;
create policy "Users remove own reactions" on public.reactions for delete using (auth.uid() = user_id);

-- DM reactions
create table if not exists public.dm_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  user_id uuid not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);
alter table public.dm_reactions enable row level security;
drop policy if exists "DM react members" on public.dm_reactions;
create policy "DM react members" on public.dm_reactions for select using (
  exists (select 1 from public.dm_messages m where m.id = message_id and public.is_dm_member(m.thread_id, auth.uid()))
);
drop policy if exists "DM react insert" on public.dm_reactions;
create policy "DM react insert" on public.dm_reactions for insert with check (
  user_id = auth.uid() and exists (select 1 from public.dm_messages m where m.id = message_id and public.is_dm_member(m.thread_id, auth.uid()))
);
drop policy if exists "DM react delete" on public.dm_reactions;
create policy "DM react delete" on public.dm_reactions for delete using (user_id = auth.uid());

-- DM read receipts
create table if not exists public.dm_reads (
  thread_id uuid not null,
  user_id uuid not null,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
alter table public.dm_reads enable row level security;
drop policy if exists "DM reads self" on public.dm_reads;
create policy "DM reads self" on public.dm_reads for select using (user_id = auth.uid());
drop policy if exists "DM reads upsert" on public.dm_reads;
create policy "DM reads upsert" on public.dm_reads for insert with check (user_id = auth.uid() and public.is_dm_member(thread_id, auth.uid()));
drop policy if exists "DM reads update" on public.dm_reads;
create policy "DM reads update" on public.dm_reads for update using (user_id = auth.uid());

-- DM reply_to and presence on profiles
alter table public.dm_messages add column if not exists reply_to uuid;
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- Posts: pin & edit
alter table public.posts add column if not exists pinned boolean not null default false;
alter table public.posts add column if not exists edited_at timestamptz;

-- Space pinned posts
create table if not exists public.space_pins (
  space_id uuid not null,
  post_id uuid not null,
  pinned_by uuid not null,
  created_at timestamptz not null default now(),
  primary key (space_id, post_id)
);
alter table public.space_pins enable row level security;
drop policy if exists "Pins visible per space rules" on public.space_pins;
create policy "Pins visible per space rules" on public.space_pins for select using (
  exists (select 1 from public.spaces s where s.id = space_id and (s.visibility = 'public' or public.is_space_member(s.id, auth.uid())))
);
drop policy if exists "Admins pin" on public.space_pins;
create policy "Admins pin" on public.space_pins for insert with check (public.is_space_admin(space_id, auth.uid()) and pinned_by = auth.uid());
drop policy if exists "Admins unpin" on public.space_pins;
create policy "Admins unpin" on public.space_pins for delete using (public.is_space_admin(space_id, auth.uid()));

-- Drafts
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('post','comment','message')),
  target_id uuid,
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists drafts_user_idx on public.drafts(user_id, updated_at desc);
alter table public.drafts enable row level security;
drop policy if exists "Drafts self" on public.drafts;
create policy "Drafts self" on public.drafts for select using (user_id = auth.uid());
drop policy if exists "Drafts insert" on public.drafts;
create policy "Drafts insert" on public.drafts for insert with check (user_id = auth.uid());
drop policy if exists "Drafts update" on public.drafts;
create policy "Drafts update" on public.drafts for update using (user_id = auth.uid());
drop policy if exists "Drafts delete" on public.drafts;
create policy "Drafts delete" on public.drafts for delete using (user_id = auth.uid());

-- Notifications priority
alter table public.notifications add column if not exists priority public.notification_priority not null default 'social';

-- Trending score function (last 24h velocity)
create or replace function public.trending_posts(_limit int default 50)
returns table(post_id uuid, score numeric)
language sql stable security definer set search_path = public as $$
  select p.id,
    (coalesce(r.cnt,0)*1.0 + coalesce(c.cnt,0)*1.5)
      / greatest(extract(epoch from (now() - p.created_at))/3600.0, 1)
  from posts p
  left join (select post_id, count(*) cnt from reactions where created_at > now() - interval '24 hours' group by post_id) r on r.post_id = p.id
  left join (select post_id, count(*) cnt from comments where created_at > now() - interval '24 hours' group by post_id) c on c.post_id = p.id
  where p.created_at > now() - interval '7 days'
  order by 2 desc
  limit _limit
$$;

-- Realtime
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.dm_reactions;
alter publication supabase_realtime add table public.dm_reads;
