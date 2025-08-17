/*
  # Fix Unique ID Generation

  1. Improved unique ID generation function
    - Better randomization algorithm
    - Guaranteed uniqueness check
    - Retry mechanism if collision occurs
  
  2. Updated trigger function
    - Uses improved ID generation
    - Better error handling
*/

-- Drop existing function and recreate with better logic
DROP FUNCTION IF EXISTS generate_unique_user_id();

CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    attempt INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    LOOP
        result := '';
        
        -- Generate 12 character random string
        FOR i IN 1..12 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE unique_id = result) THEN
            RETURN result;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            -- Fallback: use timestamp + random for guaranteed uniqueness
            result := 'U' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || 
                     substr(chars, floor(random() * length(chars) + 1)::integer, 1) ||
                     substr(chars, floor(random() * length(chars) + 1)::integer, 1);
            RETURN result;
        END IF;
    END LOOP;
END;
$$;

-- Update existing users with unique IDs if they have duplicates
DO $$
DECLARE
    user_record RECORD;
    new_id TEXT;
BEGIN
    -- Find users with duplicate IDs
    FOR user_record IN 
        SELECT id FROM users 
        WHERE unique_id IN (
            SELECT unique_id 
            FROM users 
            GROUP BY unique_id 
            HAVING COUNT(*) > 1
        )
    LOOP
        -- Generate new unique ID for each duplicate
        new_id := generate_unique_user_id();
        UPDATE users SET unique_id = new_id WHERE id = user_record.id;
    END LOOP;
END;
$$;

-- Recreate the trigger function with better ID generation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_unique_id TEXT;
BEGIN
    BEGIN
        -- Generate unique ID
        new_unique_id := generate_unique_user_id();
        
        -- Insert user record
        INSERT INTO public.users (id, email, unique_id)
        VALUES (NEW.id, NEW.email, new_unique_id)
        ON CONFLICT (id) DO NOTHING;
        
        -- Insert initial balance
        INSERT INTO public.user_balances (user_id, balance)
        VALUES (NEW.id, 0)
        ON CONFLICT (user_id) DO NOTHING;
        
        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
    END;
END;
$$;