/*
  # Update user creation trigger to handle referrals

  1. Enhanced trigger function
    - Processes referral codes from auth metadata
    - Links users to referrers automatically
    - Updates referral counts

  2. Referral processing
    - Extracts referral code from signup data
    - Finds referrer by code
    - Creates referral relationship
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Enhanced user creation function with referral support
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_referral_code TEXT;
  referrer_id UUID;
  referral_code_from_signup TEXT;
BEGIN
  BEGIN
    -- Generate unique referral code
    new_referral_code := generate_referral_code(9);
    
    -- Extract referral code from auth metadata
    referral_code_from_signup := COALESCE(
      NEW.raw_user_meta_data->>'referral_code',
      NEW.user_metadata->>'referral_code'
    );
    
    -- Find referrer if referral code provided
    IF referral_code_from_signup IS NOT NULL THEN
      SELECT id INTO referrer_id
      FROM public.users
      WHERE referral_code = referral_code_from_signup
      LIMIT 1;
    END IF;
    
    -- Create user profile
    INSERT INTO public.users (
      id,
      email,
      unique_id,
      referral_code,
      referred_by,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      generate_unique_user_id(),
      new_referral_code,
      referrer_id,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      referral_code = EXCLUDED.referral_code,
      referred_by = EXCLUDED.referred_by,
      updated_at = NOW();
    
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
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- Update referrer's count if applicable
    IF referrer_id IS NOT NULL THEN
      UPDATE public.users
      SET 
        referral_count = referral_count + 1,
        updated_at = NOW()
      WHERE id = referrer_id;
      
      RAISE LOG 'User % referred by % (code: %)', NEW.id, referrer_id, referral_code_from_signup;
    END IF;
    
    RAISE LOG 'Created user profile for % with referral code %', NEW.id, new_referral_code;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Don't re-raise to avoid breaking auth
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_referral_code(integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_unique_user_id() TO authenticated, anon;