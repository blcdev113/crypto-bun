/*
  # Recreate unique ID generation function

  1. Dependency Management
    - Remove default dependency from users table
    - Drop existing function safely
    - Recreate function with gen_random_bytes
    - Restore default on column

  2. Fix Existing Duplicates
    - Update users with duplicate IDs
    - Ensure each user has unique ID

  3. Verification
    - Test function works correctly
    - Check for any remaining duplicates
*/

-- 1. Remove the dependency
ALTER TABLE users ALTER COLUMN unique_id DROP DEFAULT;

-- 2. Drop the function
DROP FUNCTION IF EXISTS generate_unique_user_id();

-- 3. (Re)create the function
CREATE FUNCTION generate_unique_user_id()
RETURNS text AS $$
  SELECT encode(gen_random_bytes(16), 'hex');
$$ LANGUAGE sql;

-- 4. Restore the default on the column
ALTER TABLE users ALTER COLUMN unique_id SET DEFAULT generate_unique_user_id();

-- 5. Fix existing duplicate IDs
DO $$
DECLARE
    duplicate_record RECORD;
    new_id text;
BEGIN
    -- Find and fix duplicate unique_ids (keep first occurrence, update others)
    FOR duplicate_record IN 
        SELECT id, unique_id, email, ROW_NUMBER() OVER (PARTITION BY unique_id ORDER BY created_at) as rn
        FROM users 
        WHERE unique_id IN (
            SELECT unique_id 
            FROM users 
            GROUP BY unique_id 
            HAVING COUNT(*) > 1
        )
        ORDER BY unique_id, created_at
    LOOP
        -- Only update records that are not the first occurrence
        IF duplicate_record.rn > 1 THEN
            new_id := generate_unique_user_id();
            
            UPDATE users 
            SET unique_id = new_id 
            WHERE id = duplicate_record.id;
            
            RAISE NOTICE 'Updated user % (email: %) from duplicate ID % to new ID %', 
                duplicate_record.id, duplicate_record.email, duplicate_record.unique_id, new_id;
        END IF;
    END LOOP;
    
    -- Check if there are any remaining duplicates
    IF EXISTS (
        SELECT 1 FROM users 
        GROUP BY unique_id 
        HAVING COUNT(*) > 1
    ) THEN
        RAISE WARNING 'Some duplicate unique_ids still exist after cleanup';
    ELSE
        RAISE NOTICE 'All duplicate unique_ids have been resolved';
    END IF;
END $$;

-- 6. Test the function works correctly
DO $$
DECLARE
    test_id1 text;
    test_id2 text;
    test_id3 text;
BEGIN
    test_id1 := generate_unique_user_id();
    test_id2 := generate_unique_user_id();
    test_id3 := generate_unique_user_id();
    
    IF test_id1 = test_id2 OR test_id1 = test_id3 OR test_id2 = test_id3 THEN
        RAISE ERROR 'Function is still generating duplicate IDs: %, %, %', test_id1, test_id2, test_id3;
    ELSE
        RAISE NOTICE 'Function test passed - generated unique IDs: %, %, %', test_id1, test_id2, test_id3;
    END IF;
END $$;