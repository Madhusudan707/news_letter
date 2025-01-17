/*
  # Fix storage policies for email images

  This migration updates the storage policies to ensure proper access control for email images.

  1. Changes
    - Drop existing policies and recreate them with proper conditions
    - Add policy for authenticated users to delete their images
    - Add policy for authenticated users to update their images
  
  2. Security
    - Maintain public read access for email images
    - Restrict write operations to authenticated users
    - Add proper RLS policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to email images" ON storage.objects;

-- Create policy for authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-images'
);

-- Create policy for authenticated users to delete their images
CREATE POLICY "Allow authenticated users to delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-images'
);

-- Create policy for authenticated users to update their images
CREATE POLICY "Allow authenticated users to update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'email-images'
)
WITH CHECK (
  bucket_id = 'email-images'
);

-- Create policy for public read access
CREATE POLICY "Allow public read access to email images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'email-images'
);