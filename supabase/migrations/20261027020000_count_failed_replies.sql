-- respond_to_send raised on a bad token or pick, which rolled back the
-- rate-limit hit with it, so failed guesses were never counted. It now
-- returns false instead of raising, and the hit sticks.

drop function public.respond_to_send(text, bigint, text, numeric, text);

create function public.respond_to_send(
  p_token text, p_send_id bigint, p_status text, p_rating numeric, p_line text
)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  perform private.hit_rate_limit('respond:ip:' || private.client_ip(), 60, interval '10 minutes');
  perform private.hit_rate_limit('respond:token:' || md5(coalesce(p_token, '')), 30, interval '10 minutes');

  if p_status is null or p_status not in ('watched', 'seen', 'pass') then
    return false;
  end if;
  update public.sends s
  set status = p_status,
      friend_rating = p_rating,
      friend_line = coalesce(trim(p_line), ''),
      responded_at = now(),
      seen_at = null
  from public.friends f
  where s.id = p_send_id and s.friend_id = f.id and f.token = p_token;
  return found;
end;
$$;

revoke execute on function public.respond_to_send(text, bigint, text, numeric, text) from public;
grant execute on function public.respond_to_send(text, bigint, text, numeric, text) to anon, authenticated;
