// Material Storage Service
// Handles file uploads to Supabase Storage and metadata management

import { supabase } from '@/lib/supabase';

export interface MaterialMetadata {
  id: string;
  title: string;
  description?: string;
  type: 'note' | 'pdf' | 'image' | 'document' | 'presentation' | 'link' | 'other';
  fileName?: string;
  fileSize?: number;
  tags?: string[];
  supabaseUrl?: string;
  supabasePath?: string;
  uploadStatus?: 'uploading' | 'uploaded' | 'error' | 'pending';
  uploadProgress?: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_BUCKET = 'materials';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export class MaterialStorageService {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    userId: string,
    materialId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; path: string }> {
    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds 50MB limit`);
      }

      // Create file path: userId/filename (with timestamp to avoid conflicts)
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

      console.log('Uploading file to Supabase:', filePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('File uploaded successfully:', data.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (onProgress) {
        onProgress(100);
      }

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download a file from Supabase Storage
   */
  async downloadFile(filePath: string): Promise<Blob> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(filePath);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      console.log('File deleted from Supabase:', filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get a signed URL for private file access (optional)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }
  }

  /**
   * Check if storage bucket exists and is accessible
   */
  async checkBucketAccess(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
      
      if (error) {
        console.error('Bucket access error:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking bucket access:', error);
      return false;
    }
  }
}

export const materialStorageService = new MaterialStorageService();
