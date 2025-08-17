/*
  # Add Referral System

  1. New Tables
    - Update `profiles` table to include referral functionality
    - `referral_code` (text, unique) - User's own referral code
    - `referred_by` (uuid) - ID of user who referred them

  2. Security
    - Enable RLS on profiles table
    - Add policies for referral system
    - Users can read their own data and their referees' data

  3. Functions
    - Auto-generate referral codes
    - Track referral relationships
*/

-- Add referral columns to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create unique index on referral_code if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'profiles_referral_code_key'
  ) THEN
    CREATE UNIQUE INDEX profiles_referral_code_key ON profiles(referral_code);
  END IF;
END $$;

-- Update the handle_new_user function to include referral code generation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_referral_code text;
  referrer_id uuid;
BEGIN
  -- Generate unique referral code
  LOOP
    new_referral_code := encode(gen_random_bytes(6), 'hex');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_referral_code);
  END LOOP;

  -- Check if user was referred by someone (from raw_user_meta_data)
  referrer_id := NULL;
  IF NEW.raw_user_meta_data ? 'referral_code' THEN
    SELECT id INTO referrer_id 
    FROM profiles 
    WHERE referral_code = (NEW.raw_user_meta_data->>'referral_code');
  END IF;

  -- Create user profile with referral data
  INSERT INTO profiles (id, referral_code, referred_by)
  VALUES (NEW.id, new_referral_code, referrer_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create user balance record
  INSERT INTO user_balances (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create users table record
  INSERT INTO users (id, email, unique_id)
  VALUES (NEW.id, NEW.email, generate_unique_user_id())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can read own data" ON profiles;
DROP POLICY IF EXISTS "Users can update own data" ON profiles;
DROP POLICY IF EXISTS "Users can insert own data" ON profiles;

-- Allow users to read their own data and data of users they referred
CREATE POLICY "read own and invitees" ON profiles
  FOR SELECT
  TO public
  USING (auth.uid() = id OR referred_by = auth.uid());

-- Allow users to update their own data
CREATE POLICY "update own" ON profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

-- Allow users to insert their own data (for trigger)
CREATE POLICY "insert own" ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;