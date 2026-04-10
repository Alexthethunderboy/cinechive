-- Atomic onboarding completion write.
-- Validates minimum picks, replaces tastes, and marks profile completed in one transaction.

create or replace function public.complete_onboarding(p_selections jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_movie_count int := 0;
  v_genre_count int := 0;
  v_creator_count int := 0;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'Authentication required.');
  end if;

  if p_selections is null or jsonb_typeof(p_selections) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'Invalid onboarding payload.');
  end if;

  select count(*) into v_movie_count
  from jsonb_array_elements(p_selections) s
  where s->>'category' = 'movie';

  select count(*) into v_genre_count
  from jsonb_array_elements(p_selections) s
  where s->>'category' = 'genre';

  select count(*) into v_creator_count
  from jsonb_array_elements(p_selections) s
  where s->>'category' = 'creator';

  if v_movie_count < 3 or v_genre_count < 1 or v_creator_count < 1 then
    return jsonb_build_object('ok', false, 'error', 'Please complete all onboarding steps before continuing.');
  end if;

  delete from public.user_onboarding_tastes
  where user_id = v_user_id;

  insert into public.user_onboarding_tastes (user_id, category, value, display_name, poster_url)
  select
    v_user_id,
    (s->>'category')::text,
    (s->>'value')::text,
    nullif(s->>'display_name', ''),
    nullif(s->>'poster_url', '')
  from jsonb_array_elements(p_selections) s;

  update public.profiles
  set onboarding_completed = true
  where id = v_user_id;

  if not found then
    raise exception 'Profile row not found.';
  end if;

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.complete_onboarding(jsonb) to authenticated;
