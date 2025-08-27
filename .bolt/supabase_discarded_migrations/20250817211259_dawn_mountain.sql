/*
  # Update user creation to handle referrals

  1. Updates
    - Modify handle_new_user function to process referral codes
    - Create referral relationships when users sign up with referral codes
    - Ensure referral_code is set for new users
  
  2. Security
    - Maintain existing RLS policies
    - Add referral tracking
*/

-- Update the handle_new_user function to handle referrals
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_unique_id text;
  referrer_user_id uuid;
BEGIN
  -- Generate unique ID for the new user
  new_unique_id := generate_unique_user_id();
  
  -- Insert user profile
  INSERT INTO users (id, email, unique_id, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    new_unique_id,
    new_unique_id  -- Use unique_id as referral_code
  );
  
  -- Create initial balance
  INSERT INTO user_balances (user_id, balance)
  VALUES (NEW.id, 0);
  
  -- Handle referral if referral_code exists in raw_user_meta_data
  IF NEW.raw_user_meta_data ? 'referral_code' AND 
     NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND
     NEW.raw_user_meta_data->>'referral_code' != '' THEN
    
    -- Find the referrer by their referral_code
    SELECT id INTO referrer_user_id
    FROM users 
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
    LIMIT 1;
    
    -- Create referral relationship if referrer found
    IF referrer_user_id IS NOT NULL THEN
      INSERT INTO referrals (referrer_id, referred_id, status)
      VALUES (referrer_user_id, NEW.id, 'active')
      ON CONFLICT (referrer_id, referred_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure all existing users have referral_code set
UPDATE users 
SET referral_code = unique_id 
WHERE referral_code IS NULL OR referral_code = '';