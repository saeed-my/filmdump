-- Security hardening: RLS-respecting public view, rate limits on the
-- link-only RPCs, and cheaper RLS policies.

-- 1. Public recommendations.
-- The old view ran as its owner and skipped RLS, so it would list every
-- account's recommended films. Now anon reads films directly through a
-- policy and a column grant, and the view runs as the caller.

create policy "anyone reads recommended films" on public.films
  for select to anon using (recommended);

grant select (id, title, rating, poster, recommend_note, recommended)
  on public.films to anon;

alter view public.recommendations set (security_invoker = true);

-- 2. Policies: evaluate auth.uid() once per query, not once per row.

alter policy "owner reads films" on public.films
  using ((select auth.uid()) = owner);
alter policy "owner adds films" on public.films
  with check ((select auth.uid()) = owner);
alter policy "owner edits films" on public.films
  using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);
alter policy "owner deletes films" on public.films
  using ((select auth.uid()) = owner);
alter policy "owner manages friends" on public.friends
  using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);
alter policy "owner manages sends" on public.sends
  using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);

-- 3. Rate limiting.
-- Fixed-window counters in a schema the API does not expose. Going over
-- raises SQLSTATE PT429, which PostgREST returns as HTTP 429.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 1
);

create function private.hit_rate_limit(p_key text, p_max integer, p_window interval)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into private.rate_limits as r (key) values (p_key)
  on conflict (key) do update
    set hits = case when r.window_start < now() - p_window then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - p_window then now() else r.window_start end
  returning hits into v_hits;

  if v_hits > p_max then
    raise exception 'rate limit exceeded' using errcode = 'PT429',
      hint = 'Too many requests. Wait a few minutes and try again.';
  end if;

  -- Now and then, drop counters nobody has touched for a day.
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '1 day';
  end if;
end;
$$;

-- The caller's IP, as Supabase's gateway forwards it.
create function private.client_ip()
returns text
language sql stable set search_path = ''
as $$
  select coalesce(
    trim(split_part(
      current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1
    )),
    'unknown'
  );
$$;

revoke all on all functions in schema private from public, anon, authenticated;

-- A friend's page. Same output as before, now limited to 120 loads per
-- IP every 10 minutes. Volatile so it may record the hit.
create or replace function public.get_friend_page(p_token text)
returns json
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_page json;
begin
  perform private.hit_rate_limit('page:ip:' || private.client_ip(), 120, interval '10 minutes');

  select json_build_object(
    'name', f.name,
    'picks', coalesce((
      select json_agg(json_build_object(
        'id', s.id,
        'title', m.title,
        'poster', m.poster,
        'rating', m.rating,
        'note', s.note,
        'status', s.status,
        'friend_rating', s.friend_rating,
        'friend_line', s.friend_line
      ) order by s.created_at desc)
      from public.sends s
      join public.films m on m.id = s.film_id
      where s.friend_id = f.id
    ), '[]'::json)
  )
  into v_page
  from public.friends f
  where f.token = p_token;

  return v_page;
end;
$$;

-- A friend answers one pick. Limited to 30 answers per link and 60 per IP
-- every 10 minutes, so a leaked link can't be used to flood replies.
create or replace function public.respond_to_send(
  p_token text, p_send_id bigint, p_status text, p_rating numeric, p_line text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform private.hit_rate_limit('respond:ip:' || private.client_ip(), 60, interval '10 minutes');
  perform private.hit_rate_limit('respond:token:' || md5(coalesce(p_token, '')), 30, interval '10 minutes');

  if p_status not in ('watched', 'seen', 'pass') then
    raise exception 'invalid status';
  end if;
  update public.sends s
  set status = p_status,
      friend_rating = p_rating,
      friend_line = coalesce(trim(p_line), ''),
      responded_at = now(),
      seen_at = null
  from public.friends f
  where s.id = p_send_id and s.friend_id = f.id and f.token = p_token;
  if not found then
    raise exception 'pick not found';
  end if;
end;
$$;

-- create or replace keeps existing grants; restate them to be explicit.
revoke execute on function public.get_friend_page(text) from public;
revoke execute on function public.respond_to_send(text, bigint, text, numeric, text) from public;
grant execute on function public.get_friend_page(text) to anon, authenticated;
grant execute on function public.respond_to_send(text, bigint, text, numeric, text) to anon, authenticated;
