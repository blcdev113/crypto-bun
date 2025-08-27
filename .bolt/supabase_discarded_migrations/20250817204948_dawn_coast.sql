/*
  # Fix Unique ID Generation

  1. Improved Functions
    - Better random ID generation with proper collision checking
    - Enhanced uniqueness validation
    - More robust character selection

  2. Security
    - Maintains RLS policies
    - Proper error handling
*/

-- Drop existing function and recreate with better logic
DROP FUNCTION IF EXISTS generate_unique_user_id();

-- Create improved unique ID generation function
CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    random_char TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        -- Reset result for each attempt
        result := '';
        
        -- Generate 12 random characters
        FOR i IN 1..12 LOOP
            -- Get random position (1-based indexing)
            random_char := substr(chars, floor(random() * length(chars) + 1)::integer, 1);
            result := result || random_char;
        END LOOP;
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE unique_id = result) THEN
            -- Found unique ID, return it
            RETURN result;
        END IF;
        
        -- Increment attempt counter
        attempt_count := attempt_count + 1;
        
        -- Prevent infinite loop
        IF attempt_count >= max_attempts THEN
            -- Fallback: use timestamp + random chars to ensure uniqueness
            result := 'U' || extract(epoch from now())::bigint::text || substr(md5(random()::text), 1, 3);
            EXIT;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;

-- Update the trigger function to ensure it's called properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_unique_id TEXT;
BEGIN
    -- Generate a truly unique ID
    new_unique_id := generate_unique_user_id();
    
    -- Insert user record with unique ID
    INSERT INTO public.users (id, email, unique_id)
    VALUES (NEW.id, NEW.email, new_unique_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Create initial balance record
    INSERT INTO public.user_balances (user_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Update existing users with unique IDs if they have duplicates
DO $$
DECLARE
    user_record RECORD;
    new_id TEXT;
BEGIN
    -- Find users with duplicate IDs and update them
    FOR user_record IN 
        SELECT id, email FROM users 
        WHERE unique_id IN (
            SELECT unique_id 
            FROM users 
            GROUP BY unique_id 
            HAVING COUNT(*) > 1
        )
        ORDER BY created_at
    LOOP
        -- Generate new unique ID for this user
        new_id := generate_unique_user_id();
        
        -- Update the user with new unique ID
        UPDATE users 
        SET unique_id = new_id, updated_at = now()
        WHERE id = user_record.id;
        
        RAISE LOG 'Updated user % with new unique ID: %', user_record.email, new_id;
    END LOOP;
END;
$$;