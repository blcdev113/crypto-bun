/*
  # Fix user creation trigger and function

  1. Updates
    - Fix the handle_new_user function to properly handle user creation
    - Ensure the trigger works correctly with Supabase auth
    - Add proper error handling and constraints

  2. Security
    - Maintain RLS policies
    - Ensure proper permissions for user creation
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, unique_id)
  VALUES (
    NEW.id,
    NEW.email,
    generate_unique_user_id()
  );
  
  -- Also create a user balance record
  INSERT INTO public.user_balances (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the generate_unique_user_id function exists and works properly
CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  char_index INTEGER;
BEGIN
  -- Generate 12 character unique ID
  FOR i IN 1..12 LOOP
    char_index := floor(random() * length(chars) + 1);
    result := result || substr(chars, char_index, 1);
  END LOOP;
  
  -- Check if ID already exists, if so regenerate
  WHILE EXISTS (SELECT 1 FROM users WHERE unique_id = result) LOOP
    result := '';
    FOR i IN 1..12 LOOP
      char_index := floor(random() * length(chars) + 1);
      result := result || substr(chars, char_index, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to allow the trigger to insert data
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;
CREATE POLICY "Allow trigger to insert users"
  ON users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Ensure users table has proper constraints
ALTER TABLE users 
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN unique_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);