-- Clean up file paths by removing newlines and extra spaces
UPDATE songs 
SET file_path = TRIM(REPLACE(REPLACE(file_path, E'\n', ''), E'\r', ''))
WHERE file_path LIKE '%\n%' OR file_path LIKE '%\r%';

-- Also clean up other fields
UPDATE songs 
SET 
  title = TRIM(title),
  artist = TRIM(artist),
  file_name = TRIM(file_name);

-- Check the results
SELECT id, title, file_path, LENGTH(file_path) as path_length FROM songs;