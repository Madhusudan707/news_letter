/*
  # Add storage policies for email images

  1. Storage Bucket
    - Create email-images bucket
    - Enable public access
  
  2. Storage Policies
    - Allow authenticated users to upload images
    - Allow public read access
*/

-- Create email-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-images', 'email-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to email images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-images');