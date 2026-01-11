/*
  # Sync existing auth users to public.users table

  ## Problem
  Users who registered before the trigger was created don't have
  records in the public.users table.

  ## Solution
  Copy all existing auth.users to public.users table.
*/

-- Insert all existing auth users into public.users if they don't exist
INSERT INTO public.users (id, email, name, global_role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  'USER' as global_role,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);