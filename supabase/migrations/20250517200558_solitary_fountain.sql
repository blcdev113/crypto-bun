/*
  # Create user balances table

  1. New Tables
    - `user_balances`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `balance` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_balances` table
    - Add policies for authenticated users to:
      - Read their own balance
      - Update their own balance
*/

CREATE TABLE IF NOT EXISTS user_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own balance
CREATE POLICY "Users can read own balance"
  ON user_balances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to update their own balance
CREATE POLICY "Users can update own balance"
  ON user_balances
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON user_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();