/*
  # Auto-create user profile on signup

  ## Problem
  Users are not being created in the public.users table after Supabase Auth signup,
  causing the entire app to fail.

  ## Solution
  Create a database trigger that automatically creates a user profile in the
  public.users table whenever a new user signs up via Supabase Auth.

  ## Changes
  1. Create a function to handle new user creation
  2. Create a trigger on auth.users that calls this function
  3. Update RLS policies to allow this automatic insertion
*/

-- ============================================================================
-- DROP EXISTING POLICIES THAT MIGHT CONFLICT
-- ============================================================================

DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- ============================================================================
-- CREATE TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, global_role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'USER',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Allow service role to insert users (for the trigger)
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own profile (backup)
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);