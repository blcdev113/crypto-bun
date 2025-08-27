/*
  # Check unique_id column default value
  
  This migration checks the current default value for the unique_id column
  to see what's currently set.
*/

-- Check the current default value for unique_id column
SELECT 
  table_name,
  column_name,
  column_default,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'unique_id';

-- Also check if there are any functions that might be related
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%unique%' OR routine_name LIKE '%user%';

-- Check for any remaining duplicate unique_id values
SELECT 
  unique_id,
  COUNT(*) as count,
  array_agg(email) as emails
FROM users 
GROUP BY unique_id 
HAVING COUNT(*) > 1;