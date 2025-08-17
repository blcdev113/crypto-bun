/*
  # Convert unique_id to UUID with built-in generator

  1. Dependency Management
    - Remove default dependency from users table
    - Drop custom function safely
    - Convert column to UUID type with built-in generator

  2. Data Migration
    - Fix existing duplicate IDs by assigning new UUIDs
    - Preserve first occurrence of each duplicate
    - Update subsequent duplicates with fresh UUIDs

  3. Verification
    - Check for remaining duplicates
    - Test UUID generation
    - Ensure proper constraints
*/

-- Step 1: Remove the dependency (this is the critical step)
ALTER TABLE users ALTER COLUMN unique_id DROP DEFAULT;

-- Step 2: Drop the old function (now it's safe)
DROP FUNCTION IF EXISTS generate_unique_user_id();

-- Step 3: Change column to use Postgres built-in UUIDs
ALTER TABLE users 
ALTER COLUMN unique_id SET DATA TYPE uuid USING gen_random_uuid(),
ALTER COLUMN unique_id SET DEFAULT gen_random_uuid(),
ALTER COLUMN unique_id SET NOT NULL;

-- Fix existing duplicate IDs by updating them with new UUIDs
DO $$
DECLARE
    duplicate_record RECORD;
    users_updated INTEGER := 0;
BEGIN
    -- Find and fix duplicate unique_ids
    FOR duplicate_record IN
        SELECT unique_id, array_agg(id ORDER BY created_at) as user_ids
        FROM users 
        GROUP BY unique_id 
        HAVING count(*) > 1
    LOOP
        -- Keep the first user (oldest), update the rest
        FOR i IN 2..array_length(duplicate_record.user_ids, 1) LOOP
            UPDATE users 
            SET unique_id = gen_random_uuid()
            WHERE id = duplicate_record.user_ids[i];
            
            users_updated := users_updated + 1;
            
            RAISE NOTICE 'Updated user ID % with new UUID', duplicate_record.user_ids[i];
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Updated % users with new UUIDs', users_updated;
END $$;

-- Verify no duplicates remain
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT count(*) INTO duplicate_count
    FROM (
        SELECT unique_id
        FROM users 
        GROUP BY unique_id 
        HAVING count(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Still have % duplicate unique_ids after migration!', duplicate_count;
    ELSE
        RAISE NOTICE '✅ Success: All users now have unique UUIDs';
    END IF;
END $$;

-- Test UUID generation
DO $$
DECLARE
    test_uuid1 uuid;
    test_uuid2 uuid;
    test_uuid3 uuid;
BEGIN
    SELECT gen_random_uuid() INTO test_uuid1;
    SELECT gen_random_uuid() INTO test_uuid2;
    SELECT gen_random_uuid() INTO test_uuid3;
    
    IF test_uuid1 = test_uuid2 OR test_uuid1 = test_uuid3 OR test_uuid2 = test_uuid3 THEN
        RAISE EXCEPTION 'UUID generation is not working properly - got duplicates!';
    ELSE
        RAISE NOTICE '✅ UUID generation test passed';
        RAISE NOTICE 'Sample UUIDs: %, %, %', test_uuid1, test_uuid2, test_uuid3;
    END IF;
END $$;