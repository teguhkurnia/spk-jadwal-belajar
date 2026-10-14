-- sync claims (Pembaruan untuk Sistem Semester)
create or replace function public.sync_onboarding_claim()
returns trigger as $$
declare
  has_semesters boolean;
  target_user_id uuid;
begin
  -- 1. Ambil user_id dengan aman (NEW untuk INSERT/UPDATE, OLD untuk DELETE)
  target_user_id := coalesce(new.user_id, old.user_id);

  -- 2. Cek apakah user_id sudah memiliki minimal 1 semester (aktif maupun arsip)
  select exists (
    select 1 from public.semesters where user_id = target_user_id
  ) into has_semesters;

  -- 3. Update kolom raw_app_meta_data di auth.users secara otomatis
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('is_onboarding_complete', has_semesters)
  where id = target_user_id;

  -- 4. Kembalikan record yang memicu trigger
  return coalesce(new, old);
end;
$$ language plpgsql security definer;


create trigger on_semester_change
after insert or delete on public.semesters
for each row execute function public.sync_onboarding_claim();