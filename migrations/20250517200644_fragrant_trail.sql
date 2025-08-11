/*
  # Fix user balances RLS policies

  1. Changes
    - Add INSERT policy for user_balances table
    - Ensure users can only insert their own balance record
  
  2. Security
    - Enable RLS on user_balances table (already enabled)
    - Add policy for authenticated users to insert their own balance record
*/

-- Add INSERT policy for user_balances
CREATE POLICY "Users can insert own balance"
  ON public.user_balances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);