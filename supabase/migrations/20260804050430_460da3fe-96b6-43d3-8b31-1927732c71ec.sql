
REVOKE EXECUTE ON FUNCTION public.convert_tokens_to_maiki(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.send_maiki(text, numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_maiki_wallet(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.convert_tokens_to_maiki(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_maiki(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_maiki_wallet(uuid) TO authenticated;
