/*
  # Add Referral System

  1. New Columns
    - `referral_code` (text, unique) - User's own referral code
    - `referred_by` (uuid) - ID of user who referred them
    - `referral_count` (integer) - Count of successful referrals

  2. Security
    - Enable RLS on updated users table
    - Add policies for referral code lookups
    - Add foreign key constraint for referred_by

  3. Functions
    - Update user creation trigger to generate referral codes
    - Add referral tracking functionality
*/

-- Add referral columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;

-- Create index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(length_param integer DEFAULT 9)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz';
    result text := '';
    i integer;
    char_index integer;
    max_attempts integer := 100;
    attempt integer := 0;
BEGIN
    LOOP
        result := '';
        
        -- Generate random code
        FOR i IN 1..length_param LOOP
            char_index := floor(random() * length(chars))::integer + 1;
            result := result || substring(chars from char_index for 1);
        END LOOP;
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE referral_code = result) THEN
            RETURN result;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            -- Fallback: add timestamp to ensure uniqueness
            result := result || extract(epoch from now())::text;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;

-- Function to handle referral after signup
CREATE OR REPLACE FUNCTION handle_referral_signup(user_id uuid, referral_code_from_url text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_referral_code text;
    inviter_id uuid;
BEGIN
    -- Generate referral code for new user
    new_referral_code := generate_referral_code(9);
    
    -- Look up inviter if referral code provided
    IF referral_code_from_url IS NOT NULL THEN
        SELECT id INTO inviter_id
        FROM users 
        WHERE referral_code = referral_code_from_url
        LIMIT 1;
    END IF;
    
    -- Update user with referral code and referrer
    UPDATE users 
    SET 
        referral_code = new_referral_code,
        referred_by = inviter_id
    WHERE id = user_id;
    
    -- Increment referrer's count if they exist
    IF inviter_id IS NOT NULL THEN
        UPDATE users 
        SET referral_count = referral_count + 1
        WHERE id = inviter_id;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the signup process
    RAISE LOG 'Error in handle_referral_signup: %', SQLERRM;
END;
$$;

-- Update the user creation trigger to include referral code generation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_unique_id text;
    new_referral_code text;
BEGIN
    -- Generate unique user ID
    new_unique_id := generate_unique_user_id();
    
    -- Generate referral code
    new_referral_code := generate_referral_code(9);
    
    -- Insert user profile
    INSERT INTO public.users (id, email, unique_id, referral_code, referral_count)
    VALUES (
        NEW.id, 
        NEW.email, 
        new_unique_id,
        new_referral_code,
        0
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        referral_code = COALESCE(users.referral_code, EXCLUDED.referral_code);
    
    -- Create initial balance
    INSERT INTO public.user_balances (user_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Add RLS policies for referral code lookups
CREATE POLICY "Allow referral code lookups" ON users
    FOR SELECT
    TO authenticated, anon
    USING (referral_code IS NOT NULL);

-- Allow users to see their referral stats
CREATE POLICY "Users can see referral stats" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR id IN (
        SELECT referred_by FROM users WHERE auth.uid() = users.id
    ));