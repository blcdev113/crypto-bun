/*
  # Add referral_code column to users table

  1. Changes
    - Add `referral_code` column to `users` table
    - Set as unique to prevent duplicate codes
    - Add default value using random generation
    - Add index for performance

  2. Security
    - No RLS changes needed (inherits from existing table policies)
*/

-- Add referral_code column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE users ADD COLUMN referral_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex');
  END IF;
END $$;

-- Add index for referral_code lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Update existing users to have referral codes if they don't have them
UPDATE users 
SET referral_code = encode(gen_random_bytes(6), 'hex')
WHERE referral_code IS NULL;