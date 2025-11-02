import { supabase } from '@/lib/supabase';

// Admin email - replace with your actual admin email
const ADMIN_EMAIL = 'kishanindrachand@gmail.com';

// Check if current user is admin
export const isAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email === ADMIN_EMAIL;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export interface Song {
  id: string;
  title: string;
  artist?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  duration?: number;
  public_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// Upload multiple music files
export const uploadMusicFiles = async (
  files: File[],
  onProgress?: (progress: UploadProgress[]) => void
): Promise<Song[]> => {
  const results: Song[] = [];
  const progressArray: UploadProgress[] = files.map(file => ({
    fileName: file.name,
    progress: 0,
    status: 'uploading'
  }));

  // Update progress callback
  const updateProgress = (index: number, update: Partial<UploadProgress>) => {
    progressArray[index] = { ...progressArray[index], ...update };
    onProgress?.(progressArray);
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Validate file
      if (!file.type.startsWith('audio/') && !file.name.toLowerCase().endsWith('.mp3')) {
        updateProgress(i, { status: 'error', error: 'Invalid file type' });
        continue;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        updateProgress(i, { status: 'error', error: 'File too large (max 50MB)' });
        continue;
      }

      updateProgress(i, { progress: 10, status: 'uploading' });

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const uniqueFileName = `${timestamp}-${randomId}.${fileExt}`;
      const filePath = `uploads/${uniqueFileName}`;

      updateProgress(i, { progress: 30 });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        updateProgress(i, { status: 'error', error: uploadError.message });
        continue;
      }

      updateProgress(i, { progress: 70, status: 'processing' });

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(filePath);

      updateProgress(i, { progress: 90 });

      // Extract metadata from filename
      const originalName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const parts = originalName.split(' - ');
      const title = parts.length > 1 ? parts[1].trim() : originalName;
      const artist = parts.length > 1 ? parts[0].trim() : undefined;

      // Save to database
      const { data: songData, error: dbError } = await supabase
        .from('songs')
        .insert({
          title,
          artist,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          public_url: publicUrl
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file
        await supabase.storage.from('music').remove([filePath]);
        updateProgress(i, { status: 'error', error: 'Database save failed' });
        continue;
      }

      updateProgress(i, { progress: 100, status: 'completed' });
      results.push(songData);

    } catch (error) {
      console.error('Error uploading file:', error);
      updateProgress(i, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
    }
  }

  return results;
};

// Get all songs
export const getAllSongs = async (): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching songs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
};

// Get song by ID
export const getSongById = async (id: string): Promise<Song | null> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching song:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching song:', error);
    return null;
  }
};

// Delete song
export const deleteSong = async (id: string): Promise<boolean> => {
  try {
    // Get song info first
    const { data: song } = await supabase
      .from('songs')
      .select('file_path')
      .eq('id', id)
      .single();

    if (!song) {
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('music')
      .remove([song.file_path]);

    if (storageError) {
      console.warn('Error deleting file from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting song from database:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting song:', error);
    return false;
  }
};

// Search songs
export const searchSongs = async (query: string): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
      .order('title');

    if (error) {
      console.error('Error searching songs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error searching songs:', error);
    return [];
  }
};

// Update song metadata
export const updateSong = async (
  id: string, 
  updates: Partial<Pick<Song, 'title' | 'artist'>>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating song:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating song:', error);
    return false;
  }
};