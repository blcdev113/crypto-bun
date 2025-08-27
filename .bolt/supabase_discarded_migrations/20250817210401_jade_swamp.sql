/*
  # Convert unique_id to UUID with built-in generator

  1. Column Changes
    - Remove dependency on custom function
    - Drop custom function
    - Convert column to UUID type with gen_random_uuid()
    - Set default to gen_random_uuid()
    - Set NOT NULL constraint

  2. Data Migration
    - Updates existing duplicate IDs with new UUIDs
    - Maintains data integrity

  3. Verification
    - Tests UUID generation
    - Checks for remaining duplicates
*/

-- Step 1: drop dependency on the old function
ALTER TABLE users ALTER COLUMN unique_id DROP DEFAULT;

-- Step 2: drop the old custom function if it exists
DROP FUNCTION IF EXISTS generate_unique_user_id();

-- Step 3: set the column to use Postgres' built-in UUID generator
ALTER TABLE users 
ALTER COLUMN unique_id SET DATA TYPE uuid USING gen_random_uuid(),
ALTER COLUMN unique_id SET DEFAULT gen_random_uuid(),
ALTER COLUMN unique_id SET NOT NULL;

-- Fix existing duplicate IDs by updating them with new UUIDs
DO $$
DECLARE
    duplicate_record RECORD;
    update_count INTEGER := 0;
BEGIN
    -- Find and update duplicate unique_ids (keep first occurrence, update others)
    FOR duplicate_record IN
        SELECT u1.id, u1.email, u1.unique_id
        FROM users u1
        WHERE EXISTS (
            SELECT 1 FROM users u2 
            WHERE u2.unique_id = u1.unique_id 
            AND u2.id != u1.id
            AND u2.created_at < u1.created_at
        )
    LOOP
        -- Update duplicate with new UUID
        UPDATE users 
        SET unique_id = gen_random_uuid()
        WHERE id = duplicate_record.id;
        
        update_count := update_count + 1;
        
        RAISE NOTICE 'Updated user % (%) with new UUID', 
            duplicate_record.email, duplicate_record.id;
    END LOOP;
    
    RAISE NOTICE 'Updated % users with duplicate IDs', update_count;
END $$;

-- Verify no duplicates remain
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT unique_id, COUNT(*) as cnt
        FROM users
        GROUP BY unique_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'Still have % duplicate unique_ids after migration', duplicate_count;
    ELSE
        RAISE NOTICE '✅ All users now have unique UUIDs';
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
    
    IF test_uuid1 != test_uuid2 AND test_uuid2 != test_uuid3 AND test_uuid1 != test_uuid3 THEN
        RAISE NOTICE '✅ UUID generation working correctly';
        RAISE NOTICE 'Sample UUIDs: %, %, %', test_uuid1, test_uuid2, test_uuid3;
    ELSE
        RAISE WARNING '❌ UUID generation may have issues';
    END IF;
END $$;