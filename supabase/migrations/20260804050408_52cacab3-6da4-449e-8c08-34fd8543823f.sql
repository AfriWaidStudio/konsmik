
CREATE TABLE public.smai_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline text,
  tagline text,
  about text,
  location text,
  website text,
  pronouns text,
  skills text[] NOT NULL DEFAULT '{}',
  banner_url text,
  theme_color text NOT NULL DEFAULT '#22d3ee',
  is_public boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smai_profiles TO authenticated;
GRANT SELECT ON public.smai_profiles TO anon;
GRANT ALL ON public.smai_profiles TO service_role;
ALTER TABLE public.smai_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "smai_profiles_read" ON public.smai_profiles FOR SELECT USING (is_public OR user_id = auth.uid());
CREATE POLICY "smai_profiles_insert" ON public.smai_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "smai_profiles_update" ON public.smai_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "smai_profiles_delete" ON public.smai_profiles FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.smai_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text,
  url text NOT NULL,
  followers integer,
  visible boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, url)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smai_links TO authenticated;
GRANT SELECT ON public.smai_links TO anon;
GRANT ALL ON public.smai_links TO service_role;
ALTER TABLE public.smai_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "smai_links_read" ON public.smai_links FOR SELECT USING (visible OR user_id = auth.uid());
CREATE POLICY "smai_links_insert" ON public.smai_links FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "smai_links_update" ON public.smai_links FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "smai_links_delete" ON public.smai_links FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.maiki_wallets (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  address text NOT NULL UNIQUE DEFAULT ('MK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  balance numeric(18,2) NOT NULL DEFAULT 0,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.maiki_wallets TO authenticated;
GRANT ALL ON public.maiki_wallets TO service_role;
ALTER TABLE public.maiki_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maiki_wallets_read" ON public.maiki_wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "maiki_wallets_insert" ON public.maiki_wallets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.maiki_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount numeric(18,2) NOT NULL,
  balance_after numeric(18,2),
  counterparty uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.maiki_transactions TO authenticated;
GRANT ALL ON public.maiki_transactions TO service_role;
ALTER TABLE public.maiki_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maiki_tx_read" ON public.maiki_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.ensure_maiki_wallet(_user uuid)
RETURNS public.maiki_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE w public.maiki_wallets;
BEGIN
  SELECT * INTO w FROM public.maiki_wallets WHERE user_id = _user;
  IF NOT FOUND THEN
    INSERT INTO public.maiki_wallets(user_id) VALUES (_user) RETURNING * INTO w;
  END IF;
  RETURN w;
END;
$$;

CREATE OR REPLACE FUNCTION public.convert_tokens_to_maiki(_tokens integer)
RETURNS public.maiki_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _have integer;
  _amount numeric(18,2);
  w public.maiki_wallets;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _tokens IS NULL OR _tokens < 10 THEN RAISE EXCEPTION 'Minimum conversion is 10 tokens'; END IF;

  SELECT tokens_earned INTO _have FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _have IS NULL OR _have < _tokens THEN RAISE EXCEPTION 'Not enough tokens'; END IF;

  w := public.ensure_maiki_wallet(_uid);
  IF w.locked THEN RAISE EXCEPTION 'Wallet is locked'; END IF;

  _amount := round(_tokens::numeric / 10.0, 2);

  UPDATE public.profiles SET tokens_earned = tokens_earned - _tokens WHERE id = _uid;
  UPDATE public.maiki_wallets SET balance = balance + _amount, updated_at = now()
    WHERE user_id = _uid RETURNING * INTO w;

  INSERT INTO public.maiki_transactions(user_id, kind, amount, balance_after, note)
  VALUES (_uid, 'convert', _amount, w.balance, _tokens || ' tokens converted');

  RETURN w;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_maiki(_to_address text, _amount numeric, _note text DEFAULT NULL)
RETURNS public.maiki_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _to uuid;
  w public.maiki_wallets;
  tw public.maiki_wallets;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT user_id INTO _to FROM public.maiki_wallets WHERE address = upper(trim(_to_address));
  IF _to IS NULL THEN RAISE EXCEPTION 'Wallet address not found'; END IF;
  IF _to = _uid THEN RAISE EXCEPTION 'Cannot send to yourself'; END IF;

  w := public.ensure_maiki_wallet(_uid);
  IF w.locked THEN RAISE EXCEPTION 'Wallet is locked'; END IF;
  IF w.balance < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.maiki_wallets SET balance = balance - _amount, updated_at = now()
    WHERE user_id = _uid RETURNING * INTO w;
  UPDATE public.maiki_wallets SET balance = balance + _amount, updated_at = now()
    WHERE user_id = _to RETURNING * INTO tw;

  INSERT INTO public.maiki_transactions(user_id, kind, amount, balance_after, counterparty, note)
  VALUES (_uid, 'send', -_amount, w.balance, _to, _note),
         (_to, 'receive', _amount, tw.balance, _uid, _note);

  RETURN w;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_smai_profile()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_touch_smai_profile BEFORE UPDATE ON public.smai_profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_smai_profile();
