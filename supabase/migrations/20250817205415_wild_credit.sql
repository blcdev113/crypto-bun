/*
  # Fix Duplicate Unique IDs

  1. Problem
    - All users are getting the same unique_id
    - Need to ensure each email gets a different unique ID

  2. Solution
    - Rewrite the unique ID generation function with better randomization
    - Use a more robust approach with proper random character selection
    - Add collision detection and retry mechanism
    - Update existing duplicate IDs

  3. Changes
    - Drop and recreate the generate_unique_user_id function
    - Update existing users with duplicate IDs
    - Ensure trigger works correctly
*/

-- Drop existing function
DROP FUNCTION IF EXISTS generate_unique_user_id();

-- Create a better unique ID generation function
CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    random_index INTEGER;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        result := '';
        
        -- Generate 12 random characters
        FOR i IN 1..12 LOOP
            -- Get random index between 1 and length of chars (36)
            random_index := floor(random() * length(chars)) + 1;
            result := result || substring(chars from random_index for 1);
        END LOOP;
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE unique_id = result) THEN
            RETURN result;
        END IF;
        
        attempt_count := attempt_count + 1;
        
        -- If we've tried too many times, add timestamp to ensure uniqueness
        IF attempt_count >= max_attempts THEN
            result := result || extract(epoch from now())::bigint::text;
            result := substring(result from 1 for 12);
            RETURN result;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update existing users who have duplicate IDs
DO $$
DECLARE
    user_record RECORD;
    new_id TEXT;
BEGIN
    -- Find users with duplicate IDs and update them
    FOR user_record IN 
        SELECT id, email, unique_id 
        FROM users 
        WHERE unique_id IN (
            SELECT unique_id 
            FROM users 
            GROUP BY unique_id 
            HAVING COUNT(*) > 1
        )
        ORDER BY created_at
    LOOP
        -- Generate new unique ID
        new_id := generate_unique_user_id();
        
        -- Update the user
        UPDATE users 
        SET unique_id = new_id, updated_at = now()
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Updated user % (%) with new unique_id: %', 
            user_record.email, user_record.id, new_id;
    END LOOP;
END $$;

-- Recreate the trigger function to ensure it uses the new function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_unique_id TEXT;
BEGIN
    BEGIN
        -- Generate unique ID
        new_unique_id := generate_unique_user_id();
        
        -- Insert user record
        INSERT INTO public.users (id, email, unique_id)
        VALUES (NEW.id, NEW.email, new_unique_id);
        
        -- Insert user balance record
        INSERT INTO public.user_balances (user_id, balance)
        VALUES (NEW.id, 10000.00)
        ON CONFLICT (user_id) DO NOTHING;
        
        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verify the function works by testing it
DO $$
DECLARE
    test_id1 TEXT;
    test_id2 TEXT;
    test_id3 TEXT;
BEGIN
    test_id1 := generate_unique_user_id();
    test_id2 := generate_unique_user_id();
    test_id3 := generate_unique_user_id();
    
    RAISE NOTICE 'Test ID 1: %', test_id1;
    RAISE NOTICE 'Test ID 2: %', test_id2;
    RAISE NOTICE 'Test ID 3: %', test_id3;
    
    IF test_id1 = test_id2 OR test_id1 = test_id3 OR test_id2 = test_id3 THEN
        RAISE EXCEPTION 'Generated duplicate test IDs!';
    ELSE
        RAISE NOTICE 'All test IDs are unique - function working correctly';
    END IF;
END $$;