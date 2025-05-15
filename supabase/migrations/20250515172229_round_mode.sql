/*
  # Add INSERT policy for profiles table

  1. Security Changes
    - Add INSERT policy to profiles table allowing authenticated users to create their own profile
    - Policy ensures users can only create a profile with their own user ID

  Note: This complements existing policies that allow users to view and update their own profiles
*/

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);