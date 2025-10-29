-- Add file_path column to materials table for Supabase Storage integration
-- This allows storing file references instead of large binary content in the database

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_materials_file_path ON public.materials(file_path);

-- Add comment to explain the column
COMMENT ON COLUMN public.materials.file_path IS 'Path to file in Supabase Storage bucket (study-materials)';

-- Note: The 'content' column will be deprecated in favor of file_path
-- Existing content will remain for backward compatibility but new uploads should use file_path
