/*
  # Add Referral System to Users Table

  1. Schema Updates
    - Add `referral_code` column (unique, auto-generated)
    - Add `referred_by_id` column for referral relationships
    - Add `name` column for user names
    - Add `password_hash` column for password storage

  2. Referral System
    - Auto-generate unique referral codes for each user
    - Track referral relationships between users
    - Self-referencing foreign key for referral tree

  3. Security
    - Update RLS policies for new columns
    - Maintain data integrity with constraints
    - Add indexes for performance
*/

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_id UUID;

-- Create unique constraint for referral_code
ALTER TABLE users ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);

-- Add foreign key constraint for referral relationship
ALTER TABLE users ADD CONSTRAINT users_referred_by_id_fkey 
  FOREIGN KEY (referred_by_id) REFERENCES users(id);

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by_id ON users(referred_by_id);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
  attempt_count INTEGER := 0;
BEGIN
  LOOP
    -- Generate 8-character referral code (letters and numbers)
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random() * 36 + 1)::int, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists_check;
    
    -- If unique, return the code
    IF NOT exists_check THEN
      RETURN code;
    END IF;
    
    -- Prevent infinite loop
    attempt_count := attempt_count + 1;
    IF attempt_count > 100 THEN
      -- Fallback: use timestamp-based code
      code := 'REF' || EXTRACT(EPOCH FROM NOW())::TEXT;
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Update existing users to have referral codes
UPDATE users 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after populating existing records
ALTER TABLE users ALTER COLUMN referral_code SET NOT NULL;

-- Update the trigger function to include referral code generation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_unique_id TEXT;
  new_referral_code TEXT;
BEGIN
  BEGIN
    -- Generate unique user ID
    new_unique_id := generate_unique_user_id();
    
    -- Generate unique referral code
    new_referral_code := generate_referral_code();
    
    -- Insert user profile
    INSERT INTO public.users (
      id, 
      email, 
      unique_id, 
      referral_code,
      created_at, 
      updated_at
    ) VALUES (
      NEW.id, 
      NEW.email, 
      new_unique_id,
      new_referral_code,
      NOW(), 
      NOW()
    );
    
    -- Create initial balance
    INSERT INTO public.user_balances (
      user_id, 
      balance, 
      created_at, 
      updated_at
    ) VALUES (
      NEW.id, 
      10000.00, 
      NOW(), 
      NOW()
    );
    
    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
  END;
END;
$$;

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add policy for referral code lookups (users can search by referral code)
CREATE POLICY "Users can lookup referral codes"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);