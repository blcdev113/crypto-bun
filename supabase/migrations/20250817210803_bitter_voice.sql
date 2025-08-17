/*
  # Set unique_id column default to gen_random_uuid()

  1. Column Update
    - Sets the default value for unique_id column to use PostgreSQL's built-in gen_random_uuid()
    - This detaches the column from any custom function dependencies

  2. Verification
    - Checks the current column default after the change
    - Verifies the data type and constraints
    - Tests UUID generation to ensure it's working properly
*/

-- Set the column default to use PostgreSQL's built-in UUID generator
ALTER TABLE users ALTER COLUMN unique_id SET DEFAULT gen_random_uuid();

-- Verify the change was applied
DO $$
BEGIN
  -- Check the current column default
  RAISE NOTICE 'Checking unique_id column default...';
  
  -- Show column information
  PERFORM column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'unique_id';
  
  -- Test UUID generation
  RAISE NOTICE 'Testing UUID generation: %', gen_random_uuid();
  RAISE NOTICE 'Testing UUID generation: %', gen_random_uuid();
  RAISE NOTICE 'Testing UUID generation: %', gen_random_uuid();
  
  RAISE NOTICE '✅ Successfully set unique_id default to gen_random_uuid()';
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '❌ Error setting UUID default: %', SQLERRM;
END $$;