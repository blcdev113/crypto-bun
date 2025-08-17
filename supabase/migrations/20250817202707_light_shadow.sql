/*
  # Create users table with unique IDs

  1. New Tables
    - `users`
      - `id` (uuid, primary key, matches auth.users.id)
      - `email` (text, unique)
      - `unique_id` (text, unique, auto-generated format like 9HDDRD0RS000)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for users to update their own data

  3. Functions
    - Auto-generate unique ID function
    - Trigger to create user record on auth signup
*/

-- Function to generate unique user ID
CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    char_index INTEGER;
BEGIN
    -- Generate 12 character unique ID (format: 9HDDRD0RS000)
    FOR i IN 1..12 LOOP
        char_index := floor(random() * length(chars) + 1);
        result := result || substr(chars, char_index, 1);
    END LOOP;
    
    -- Ensure uniqueness by checking if ID already exists
    WHILE EXISTS (SELECT 1 FROM users WHERE unique_id = result) LOOP
        result := '';
        FOR i IN 1..12 LOOP
            char_index := floor(random() * length(chars) + 1);
            result := result || substr(chars, char_index, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  unique_id text UNIQUE NOT NULL DEFAULT generate_unique_user_id(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create trigger function to automatically create user record
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, unique_id)
  VALUES (
    NEW.id,
    NEW.email,
    generate_unique_user_id()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();