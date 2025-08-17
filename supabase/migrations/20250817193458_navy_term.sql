/*
  # Create verification codes table for email OTP

  1. New Tables
    - `verification_codes`
      - `id` (uuid, primary key)
      - `email` (text)
      - `code` (text, 6-digit verification code)
      - `expires_at` (timestamp)
      - `used` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `verification_codes` table
    - Add policies for public access (needed for verification)

  3. Indexes
    - Add indexes for email, code, and expires_at for performance
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

-- Allow anyone to insert verification codes
CREATE POLICY "Anyone can insert verification codes"
  ON verification_codes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read verification codes for verification
CREATE POLICY "Anyone can read verification codes for verification"
  ON verification_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to update verification codes (mark as used)
CREATE POLICY "Anyone can update verification codes"
  ON verification_codes
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);