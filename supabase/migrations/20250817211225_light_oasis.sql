/*
  # Create referral system

  1. New Tables
    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references users)
      - `referred_id` (uuid, references users)
      - `created_at` (timestamp)
      - `status` (text, default 'pending')
  
  2. Security
    - Enable RLS on `referrals` table
    - Add policies for users to read their own referral data
  
  3. Changes
    - Add referral tracking functionality
    - Track who invited whom
*/

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  UNIQUE(referrer_id, referred_id)
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

-- Add referral_code column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE users ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Update existing users to have referral codes (same as their unique_id)
UPDATE users 
SET referral_code = unique_id 
WHERE referral_code IS NULL;

-- Create function to get referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(user_uuid uuid)
RETURNS TABLE (
  total_referrals bigint,
  active_referrals bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_referrals,
    COUNT(*) FILTER (WHERE status = 'active') as active_referrals
  FROM referrals 
  WHERE referrer_id = user_uuid;
END;
$$;