-- Create policies for check-in-photos storage bucket to allow users to upload and access their own photos

-- Allow users to upload photos (INSERT)
CREATE POLICY "Users can upload check-in photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own photos (SELECT)
CREATE POLICY "Users can view their own check-in photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own photos (UPDATE)
CREATE POLICY "Users can update their own check-in photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own photos (DELETE)
CREATE POLICY "Users can delete their own check-in photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]);