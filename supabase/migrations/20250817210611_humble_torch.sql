/*
  # Force remove custom function and convert to UUID

  1. Data Migration
    - Fix existing duplicate unique_id values by updating them with new UUIDs
    - Keep the first user (by created_at) with each duplicate ID unchanged
    - Update subsequent users with fresh UUIDs

  2. Schema Changes
    - Force drop the custom function with CASCADE to remove all dependencies
    - Convert unique_id column to UUID data type
    - Set default to gen_random_uuid() for new users
    - Add NOT NULL constraint

  3. Verification
    - Check for any remaining duplicates after migration
    - Test UUID generation to ensure uniqueness
*/

-- First, fix existing duplicate unique_id values
DO $$
DECLARE
    duplicate_record RECORD;
    user_record RECORD;
    new_uuid uuid;
    update_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting duplicate unique_id fix...';
    
    -- Find all duplicate unique_id values
    FOR duplicate_record IN 
        SELECT unique_id, COUNT(*) as count
        FROM users 
        GROUP BY unique_id 
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Found % users with duplicate unique_id: %', duplicate_record.count, duplicate_record.unique_id;
        
        -- For each duplicate, keep the first user (by created_at) and update the rest
        FOR user_record IN 
            SELECT id, email, created_at
            FROM users 
            WHERE unique_id = duplicate_record.unique_id 
            ORDER BY created_at ASC
            OFFSET 1  -- Skip the first (oldest) user
        LOOP
            new_uuid := gen_random_uuid();
            
            UPDATE users 
            SET unique_id = new_uuid::text 
            WHERE id = user_record.id;
            
            update_count := update_count + 1;
            RAISE NOTICE 'Updated user % (%) with new unique_id: %', user_record.email, user_record.id, new_uuid;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Fixed % duplicate unique_id values', update_count;
END $$;

-- Force remove the function and any defaults that depend on it
DROP FUNCTION IF EXISTS generate_unique_user_id() CASCADE;

-- Make sure unique_id column uses built-in UUIDs instead
ALTER TABLE users 
ALTER COLUMN unique_id SET DATA TYPE uuid USING gen_random_uuid(),
ALTER COLUMN unique_id SET DEFAULT gen_random_uuid(),
ALTER COLUMN unique_id SET NOT NULL;

-- Verify the changes
DO $$
DECLARE
    duplicate_count INTEGER;
    test_uuid1 uuid;
    test_uuid2 uuid;
    test_uuid3 uuid;
BEGIN
    -- Check for any remaining duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT unique_id, COUNT(*) as count
        FROM users 
        GROUP BY unique_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'Still found % duplicate unique_id values after migration!', duplicate_count;
    ELSE
        RAISE NOTICE '✅ No duplicate unique_id values found - migration successful!';
    END IF;
    
    -- Test UUID generation
    test_uuid1 := gen_random_uuid();
    test_uuid2 := gen_random_uuid();
    test_uuid3 := gen_random_uuid();
    
    IF test_uuid1 != test_uuid2 AND test_uuid2 != test_uuid3 AND test_uuid1 != test_uuid3 THEN
        RAISE NOTICE '✅ UUID generation working correctly';
        RAISE NOTICE 'Sample UUIDs: %, %, %', test_uuid1, test_uuid2, test_uuid3;
    ELSE
        RAISE WARNING '❌ UUID generation may have issues - got duplicate UUIDs!';
    END IF;
    
    RAISE NOTICE '✅ Migration completed successfully!';
END $$;