-- Rate limiter for the edge functions (used by `chat`; any function can reuse it).
--
-- Why in the database: edge function instances are many and short-lived, so in-memory counters reset
-- and don't add up. And why not count rows in `messages` like before: that check ran before the insert,
-- so a burst of parallel requests all passed it, and it can only count per patient, which means
-- nothing when anyone can create a guest account.
--
-- One call checks a list of limits (per account, per IP, global; each over a few windows) in a single
-- atomic step:
--   - every limit is a fixed window: `max` calls per `window_seconds`, counted in `private.rate_limits`
--   - each counter is bumped with an upsert, so concurrent calls queue on the row and can't overshoot
--   - the first limit that is over stops the call, and ALL the increments of that call are undone, so
--     the counters only ever count accepted calls (a blocked call costs nobody any budget, and the
--     global counter equals the number of Claude calls made)
-- Only the service role can call it: callers can't pick their own keys or reset a counter.

create table private.rate_limits (
  key            text        not null,
  window_seconds integer     not null,
  window_start   timestamptz not null,
  hits           integer     not null default 0,
  primary key (key, window_seconds, window_start)
);
create index rate_limits_window_start_idx on private.rate_limits (window_start);

alter table private.rate_limits enable row level security;
revoke all on private.rate_limits from public, anon, authenticated;

-- Returns no row when every limit has room, or one row naming the first limit that is full:
--   blocked      1-based position of that limit in the arrays
--   retry_after  seconds until its window ends
create function public.hit_rate_limits(p_keys text[], p_windows integer[], p_maxes integer[])
returns table (blocked integer, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  n      integer := coalesce(cardinality(p_keys), 0);
  i      integer;
  secs   double precision := extract(epoch from now());
  bucket double precision;
  seen   integer;
begin
  if n = 0 or n <> coalesce(cardinality(p_windows), 0) or n <> coalesce(cardinality(p_maxes), 0) then
    raise exception 'hit_rate_limits: keys, windows and maxes must be non-empty and the same length'
      using errcode = '22023';
  end if;

  -- Housekeeping: now and then, drop counters whose window ended long ago (windows are at most a day).
  if random() < 0.02 then
    delete from private.rate_limits where window_start < now() - interval '2 days';
  end if;

  begin
    for i in 1 .. n loop
      if p_keys[i] is null or p_keys[i] = '' or p_windows[i] is null or p_windows[i] not between 1 and 86400
         or p_maxes[i] is null or p_maxes[i] < 0 then
        raise exception 'hit_rate_limits: bad limit at position %', i using errcode = '22023';
      end if;

      bucket := floor(secs / p_windows[i]) * p_windows[i];
      insert into private.rate_limits as r (key, window_seconds, window_start, hits)
      values (p_keys[i], p_windows[i], to_timestamp(bucket), 1)
      on conflict (key, window_seconds, window_start) do update set hits = r.hits + 1
      returning r.hits into seen;

      if seen > p_maxes[i] then
        blocked := i;
        retry_after := greatest(1, ceil(bucket + p_windows[i] - secs))::integer;
        raise exception 'rate limited' using errcode = 'RL001';
      end if;
    end loop;
  exception when sqlstate 'RL001' then
    null; -- the block's increments are rolled back; `blocked` and `retry_after` are plain variables, so they stay
  end;

  if blocked is not null then
    return next;
  end if;
end $$;

-- Supabase's default privileges would let anon and authenticated call it through the API.
revoke all on function public.hit_rate_limits(text[], integer[], integer[]) from public, anon, authenticated;
grant execute on function public.hit_rate_limits(text[], integer[], integer[]) to service_role;
