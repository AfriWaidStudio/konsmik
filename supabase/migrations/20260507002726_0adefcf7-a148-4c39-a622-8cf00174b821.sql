
-- ===== ENUMS =====
create type public.space_kind as enum ('group', 'page', 'circle');
create type public.space_role as enum ('admin', 'moderator', 'member');
create type public.space_visibility as enum ('public', 'private', 'invite_only');
create type public.report_status as enum ('open', 'reviewed', 'dismissed');

-- ===== SPACES =====
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  kind public.space_kind not null,
  name text not null,
  slug text not null unique,
  description text,
  cover_url text,
  avatar_url text,
  visibility public.space_visibility not null default 'public',
  owner_id uuid not null,
  member_count integer not null default 1,
  community public.community_kind not null default 'kons',
  created_at timestamptz not null default now()
);
create index spaces_kind_idx on public.spaces(kind);
create index spaces_owner_idx on public.spaces(owner_id);
alter table public.spaces enable row level security;

create table public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null,
  role public.space_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (space_id, user_id)
);
create index space_members_user_idx on public.space_members(user_id);
alter table public.space_members enable row level security;

create or replace function public.is_space_admin(_space uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.space_members
    where space_id = _space and user_id = _user and role in ('admin','moderator'))
  or exists(select 1 from public.spaces where id = _space and owner_id = _user);
$$;

create or replace function public.is_space_member(_space uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.space_members
    where space_id = _space and user_id = _user)
  or exists(select 1 from public.spaces where id = _space and owner_id = _user);
$$;

create policy "Spaces visible by visibility" on public.spaces for select
  using (visibility = 'public' or owner_id = auth.uid() or public.is_space_member(id, auth.uid()));
create policy "Authenticated create spaces" on public.spaces for insert with check (auth.uid() = owner_id);
create policy "Owners update spaces" on public.spaces for update using (owner_id = auth.uid());
create policy "Owners delete spaces" on public.spaces for delete using (owner_id = auth.uid());

create policy "Members visible per space" on public.space_members for select
  using (
    exists (select 1 from public.spaces s where s.id = space_id and s.visibility = 'public')
    or public.is_space_member(space_id, auth.uid())
  );
create policy "Users join public or invited" on public.space_members for insert
  with check (
    user_id = auth.uid() and (
      exists (select 1 from public.spaces s where s.id = space_id and s.visibility = 'public')
      or public.is_space_admin(space_id, auth.uid())
    )
  );
create policy "Admins update members" on public.space_members for update using (public.is_space_admin(space_id, auth.uid()));
create policy "Users leave or admins remove" on public.space_members for delete
  using (user_id = auth.uid() or public.is_space_admin(space_id, auth.uid()));

create or replace function public.handle_new_space()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.space_members (space_id, user_id, role) values (new.id, new.owner_id, 'admin');
  return new;
end; $$;
create trigger on_new_space after insert on public.spaces
for each row execute function public.handle_new_space();

create or replace function public.adjust_space_member_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.spaces set member_count = member_count + 1 where id = new.space_id;
  elsif tg_op = 'DELETE' then
    update public.spaces set member_count = greatest(0, member_count - 1) where id = old.space_id;
  end if;
  return null;
end; $$;
create trigger space_members_count after insert or delete on public.space_members
for each row execute function public.adjust_space_member_count();

-- ===== POSTS additions =====
alter table public.posts add column space_id uuid references public.spaces(id) on delete set null;
alter table public.posts add column repost_of uuid references public.posts(id) on delete set null;
create index posts_space_idx on public.posts(space_id);
create index posts_hashtags_idx on public.posts using gin(hashtags);

drop policy if exists "Posts viewable by everyone" on public.posts;
create policy "Posts viewable when space allows" on public.posts for select using (
  space_id is null
  or exists (select 1 from public.spaces s where s.id = space_id and s.visibility = 'public')
  or public.is_space_member(space_id, auth.uid())
);

-- ===== BOOKMARKS =====
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  post_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);
alter table public.bookmarks enable row level security;
create policy "Users see own bookmarks" on public.bookmarks for select using (user_id = auth.uid());
create policy "Users add own bookmarks" on public.bookmarks for insert with check (user_id = auth.uid());
create policy "Users delete own bookmarks" on public.bookmarks for delete using (user_id = auth.uid());

-- ===== MENTIONS =====
create table public.mentions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid,
  comment_id uuid,
  mentioned_user_id uuid not null,
  by_user_id uuid not null,
  created_at timestamptz not null default now()
);
alter table public.mentions enable row level security;
create policy "Mentions visible to mentioned or author" on public.mentions for select
  using (mentioned_user_id = auth.uid() or by_user_id = auth.uid());
create policy "Authors create mentions" on public.mentions for insert with check (by_user_id = auth.uid());

-- ===== REPORTS =====
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  target_type text not null check (target_type in ('post','user','comment','space')),
  target_id uuid not null,
  reason text not null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "Users create reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "Reporter or admin views" on public.reports for select
  using (reporter_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins update reports" on public.reports for update using (public.has_role(auth.uid(), 'admin'));

-- ===== BLOCKS =====
create table public.blocks (
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.blocks enable row level security;
create policy "Users see own blocks" on public.blocks for select using (blocker_id = auth.uid());
create policy "Users add own blocks" on public.blocks for insert with check (blocker_id = auth.uid());
create policy "Users remove own blocks" on public.blocks for delete using (blocker_id = auth.uid());

-- ===== DIRECT MESSAGES =====
create table public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create table public.dm_members (
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
create table public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.dm_threads enable row level security;
alter table public.dm_members enable row level security;
alter table public.dm_messages enable row level security;

create or replace function public.is_dm_member(_thread uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.dm_members where thread_id = _thread and user_id = _user);
$$;

create policy "Members view threads" on public.dm_threads for select using (public.is_dm_member(id, auth.uid()));
create policy "Authenticated create threads" on public.dm_threads for insert with check (auth.uid() is not null);

create policy "Members view memberships" on public.dm_members for select using (public.is_dm_member(thread_id, auth.uid()));
create policy "Add self or invite" on public.dm_members for insert with check (auth.uid() is not null);

create policy "Members view messages" on public.dm_messages for select using (public.is_dm_member(thread_id, auth.uid()));
create policy "Members send messages" on public.dm_messages for insert
  with check (sender_id = auth.uid() and public.is_dm_member(thread_id, auth.uid()));

-- ===== SEARCH TERMS =====
create table public.search_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);
create index search_terms_term_idx on public.search_terms(term);
alter table public.search_terms enable row level security;
create policy "Anyone reads search terms" on public.search_terms for select using (true);
create policy "Anyone insert search terms" on public.search_terms for insert with check (true);

-- ===== NOTIFICATIONS: triggers =====
create policy "Allow trigger inserts" on public.notifications for insert with check (true);

create or replace function public.notify_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare _author uuid; _name text;
begin
  select author_id into _author from public.posts where id = new.post_id;
  if _author is null or _author = new.user_id then return new; end if;
  select display_name into _name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, payload)
    values (_author, 'like', jsonb_build_object('post_id', new.post_id, 'by', new.user_id, 'message', coalesce(_name,'Someone') || ' liked your post'));
  return new;
end; $$;
create trigger on_like after insert on public.likes for each row execute function public.notify_like();

create or replace function public.notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare _author uuid; _name text;
begin
  select author_id into _author from public.posts where id = new.post_id;
  if _author is null or _author = new.user_id then return new; end if;
  select display_name into _name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, payload)
    values (_author, 'comment', jsonb_build_object('post_id', new.post_id, 'by', new.user_id, 'message', coalesce(_name,'Someone') || ' commented on your post'));
  return new;
end; $$;
create trigger on_comment after insert on public.comments for each row execute function public.notify_comment();

create or replace function public.notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
declare _name text;
begin
  if new.follower_id = new.following_id then return new; end if;
  select display_name into _name from public.profiles where id = new.follower_id;
  insert into public.notifications (user_id, type, payload)
    values (new.following_id, 'follow', jsonb_build_object('by', new.follower_id, 'message', coalesce(_name,'Someone') || ' started following you'));
  return new;
end; $$;
create trigger on_follow after insert on public.follows for each row execute function public.notify_follow();

create or replace function public.notify_mention()
returns trigger language plpgsql security definer set search_path = public as $$
declare _name text;
begin
  if new.by_user_id = new.mentioned_user_id then return new; end if;
  select display_name into _name from public.profiles where id = new.by_user_id;
  insert into public.notifications (user_id, type, payload)
    values (new.mentioned_user_id, 'mention', jsonb_build_object('post_id', new.post_id, 'by', new.by_user_id, 'message', coalesce(_name,'Someone') || ' mentioned you'));
  return new;
end; $$;
create trigger on_mention after insert on public.mentions for each row execute function public.notify_mention();

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.dm_messages;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.comments;
