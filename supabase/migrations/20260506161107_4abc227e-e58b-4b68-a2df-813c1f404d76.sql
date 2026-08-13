
-- Enums
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.post_type as enum ('article', 'reel', 'image', 'ai_insight', 'discussion');
create type public.community_kind as enum ('kons', 'waides', 'smai');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  title text default 'Member',
  bio text,
  avatar_url text,
  tokens_earned integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Roles viewable by self or admin"
  on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles"
  on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- New user trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  i int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'));
  if base_username = '' or base_username is null then base_username := 'user' || substr(new.id::text,1,6); end if;
  final_username := base_username;
  while exists(select 1 from public.profiles where username = final_username) loop
    i := i + 1;
    final_username := base_username || i::text;
  end loop;

  insert into public.profiles (id, username, display_name, title)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', final_username),
    coalesce(new.raw_user_meta_data->>'title', 'Consciousness Explorer')
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  community community_kind not null default 'kons',
  type post_type not null default 'discussion',
  body text not null,
  media_url text,
  category text,
  hashtags text[] not null default '{}',
  trending boolean not null default false,
  views integer not null default 0,
  tokens integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;

create policy "Posts viewable by everyone" on public.posts for select using (true);
create policy "Authenticated can insert own posts" on public.posts for insert
  with check (auth.uid() = author_id);
create policy "Authors update own posts" on public.posts for update using (auth.uid() = author_id);
create policy "Authors delete own posts" on public.posts for delete using (auth.uid() = author_id);

create index posts_created_idx on public.posts (created_at desc);
create index posts_community_idx on public.posts (community, created_at desc);

-- Likes
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);
alter table public.likes enable row level security;
create policy "Likes viewable by everyone" on public.likes for select using (true);
create policy "Users like as themselves" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users unlike own" on public.likes for delete using (auth.uid() = user_id);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
create policy "Comments viewable by everyone" on public.comments for select using (true);
create policy "Users comment as themselves" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users update own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Users delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Follows
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);
alter table public.follows enable row level security;
create policy "Follows viewable by everyone" on public.follows for select using (true);
create policy "Users follow as themselves" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users unfollow own" on public.follows for delete using (auth.uid() = follower_id);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "Users see own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Konsai conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "Users see own conversations" on public.conversations for select using (auth.uid() = user_id);
create policy "Users create own conversations" on public.conversations for insert with check (auth.uid() = user_id);
create policy "Users update own conversations" on public.conversations for update using (auth.uid() = user_id);
create policy "Users delete own conversations" on public.conversations for delete using (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "Users see own messages" on public.messages for select using (
  exists(select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
create policy "Users insert own messages" on public.messages for insert with check (
  exists(select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);

-- Storage bucket for media
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;

create policy "Public read media" on storage.objects for select using (bucket_id = 'media');
create policy "Auth upload media" on storage.objects for insert
  with check (bucket_id = 'media' and auth.uid() is not null);
create policy "Owner update media" on storage.objects for update using (bucket_id = 'media' and owner = auth.uid());
create policy "Owner delete media" on storage.objects for delete using (bucket_id = 'media' and owner = auth.uid());
