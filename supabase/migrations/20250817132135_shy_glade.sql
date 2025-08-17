/*
  # Create verification codes table

  1. New Tables
    - `verification_codes`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `code` (text, not null)
      - `expires_at` (timestamp, not null)
      - `used` (boolean, default false)
      - `created_at` (timestamp, default now())

  2. Security
    - Enable RLS on `verification_codes` table
    - Add policies for code verification
    - Add cleanup function for expired codes

  3. Indexes
    - Index on email for faster lookups
    - Index on expires_at for cleanup operations
*/

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);

-- Policy to allow anyone to insert verification codes (for registration)
CREATE POLICY "Anyone can insert verification codes"
  ON verification_codes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy to allow anyone to read verification codes for verification
CREATE POLICY "Anyone can read verification codes for verification"
  ON verification_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy to allow anyone to update verification codes (mark as used)
CREATE POLICY "Anyone can update verification codes"
  ON verification_codes
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired codes every hour
-- Note: This requires pg_cron extension which may not be available in all environments
-- You can run this manually or set up a cron job externally
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();');