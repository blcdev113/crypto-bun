/*
  # Update unique ID generation function

  1. Function Updates
    - Replace existing function with gen_random_bytes implementation
    - Use hex encoding for readable IDs
    - Ensure proper uniqueness checking

  2. Fix Existing Duplicates
    - Update any users with duplicate IDs
    - Assign new unique IDs to affected accounts

  3. Verification
    - Test the new function
    - Ensure all users have unique IDs
*/

-- Drop and recreate the unique ID generation function
CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS text AS $$
  SELECT encode(gen_random_bytes(16), 'hex');
$$ LANGUAGE sql;

-- Fix any existing duplicate IDs
DO $$
DECLARE
    duplicate_id text;
    user_record record;
    new_id text;
BEGIN
    -- Find duplicate IDs
    FOR duplicate_id IN 
        SELECT unique_id 
        FROM users 
        GROUP BY unique_id 
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Found duplicate ID: %', duplicate_id;
        
        -- Update all but the first user with this duplicate ID
        FOR user_record IN 
            SELECT id, email 
            FROM users 
            WHERE unique_id = duplicate_id 
            ORDER BY created_at 
            OFFSET 1
        LOOP
            -- Generate new unique ID
            LOOP
                new_id := generate_unique_user_id();
                EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE unique_id = new_id);
            END LOOP;
            
            -- Update the user
            UPDATE users 
            SET unique_id = new_id 
            WHERE id = user_record.id;
            
            RAISE NOTICE 'Updated user % (%) with new ID: %', 
                user_record.email, user_record.id, new_id;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Finished fixing duplicate IDs';
END $$;

-- Verify all IDs are now unique
DO $$
DECLARE
    duplicate_count integer;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT unique_id 
        FROM users 
        GROUP BY unique_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All user IDs are now unique!';
    ELSE
        RAISE NOTICE 'WARNING: Still found % duplicate IDs', duplicate_count;
    END IF;
END $$;

-- Test the function generates different IDs
DO $$
DECLARE
    id1 text;
    id2 text;
    id3 text;
BEGIN
    id1 := generate_unique_user_id();
    id2 := generate_unique_user_id();
    id3 := generate_unique_user_id();
    
    RAISE NOTICE 'Test ID 1: %', id1;
    RAISE NOTICE 'Test ID 2: %', id2;
    RAISE NOTICE 'Test ID 3: %', id3;
    
    IF id1 != id2 AND id2 != id3 AND id1 != id3 THEN
        RAISE NOTICE 'SUCCESS: Function generates unique IDs!';
    ELSE
        RAISE NOTICE 'ERROR: Function still generating duplicate IDs!';
    END IF;
END $$;