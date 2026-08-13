CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.wants_notification(_user uuid, _kind text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE((
    SELECT CASE _kind
      WHEN 'follow' THEN notif_follows
      WHEN 'like' THEN notif_likes
      WHEN 'comment' THEN notif_comments
      WHEN 'mention' THEN notif_mentions
      WHEN 'message' THEN notif_messages
      ELSE true END
    FROM public.user_settings WHERE user_id = _user
  ), true);
$$;

CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _name text;
begin
  if new.follower_id = new.following_id then return new; end if;
  if not public.wants_notification(new.following_id, 'follow') then return new; end if;
  select display_name into _name from public.profiles where id = new.follower_id;
  insert into public.notifications (user_id, type, payload)
    values (new.following_id, 'follow', jsonb_build_object('by', new.follower_id, 'message', coalesce(_name,'Someone') || ' started following you'));
  return new;
end; $$;

CREATE OR REPLACE FUNCTION public.notify_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _author uuid; _name text;
begin
  select author_id into _author from public.posts where id = new.post_id;
  if _author is null or _author = new.user_id then return new; end if;
  if not public.wants_notification(_author, 'like') then return new; end if;
  select display_name into _name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, payload)
    values (_author, 'like', jsonb_build_object('post_id', new.post_id, 'by', new.user_id, 'message', coalesce(_name,'Someone') || ' liked your post'));
  return new;
end; $$;

CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _author uuid; _name text;
begin
  select author_id into _author from public.posts where id = new.post_id;
  if _author is null or _author = new.user_id then return new; end if;
  if not public.wants_notification(_author, 'comment') then return new; end if;
  select display_name into _name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, payload)
    values (_author, 'comment', jsonb_build_object('post_id', new.post_id, 'by', new.user_id, 'message', coalesce(_name,'Someone') || ' commented on your post'));
  return new;
end; $$;

CREATE OR REPLACE FUNCTION public.notify_mention()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _name text;
begin
  if new.by_user_id = new.mentioned_user_id then return new; end if;
  if not public.wants_notification(new.mentioned_user_id, 'mention') then return new; end if;
  select display_name into _name from public.profiles where id = new.by_user_id;
  insert into public.notifications (user_id, type, payload)
    values (new.mentioned_user_id, 'mention', jsonb_build_object('post_id', new.post_id, 'by', new.by_user_id, 'message', coalesce(_name,'Someone') || ' mentioned you'));
  return new;
end; $$;