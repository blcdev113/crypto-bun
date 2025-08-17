/*
  # Add referral_code column to users table

  1. New Column
    - `referral_code` (text, unique, not null)
    - Default value generates random 8-character hex string
    - Index for fast lookups

  2. Security
    - No RLS changes needed (inherits from table)

  3. Data Migration
    - Backfill existing users with unique referral codes
*/

-- Add referral_code column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code text 
DEFAULT encode(gen_random_bytes(4), 'hex') 
NOT NULL;

-- Create unique constraint
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS users_referral_code_unique 
UNIQUE (referral_code);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code 
ON users (referral_code);

-- Update any existing users that might have NULL referral codes
UPDATE users 
SET referral_code = encode(gen_random_bytes(4), 'hex')
WHERE referral_code IS NULL;

-- Ensure all referral codes are unique by regenerating duplicates
DO $$
DECLARE
    duplicate_record RECORD;
BEGIN
    FOR duplicate_record IN 
        SELECT id FROM users 
        WHERE referral_code IN (
            SELECT referral_code 
            FROM users 
            GROUP BY referral_code 
            HAVING COUNT(*) > 1
        )
    LOOP
        UPDATE users 
        SET referral_code = encode(gen_random_bytes(4), 'hex')
        WHERE id = duplicate_record.id;
    END LOOP;
END $$;