import { supabase } from '@/lib/supabase'

const STORAGE_BUCKET = 'study-materials'

export interface UploadResult {
  path: string
  publicUrl?: string
  error?: string
}

/**
 * Storage Service for handling file uploads to Supabase Storage
 * This service provides a centralized way to manage file uploads, downloads, and deletions
 */
export const storageService = {
  /**
   * Initialize the storage bucket (call this once on app startup)
   */
  async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET)

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
          public: false, // Private bucket - requires signed URLs
          fileSizeLimit: 104857600, // 100MB limit
        })

        if (error) {
          console.error('Error creating storage bucket:', error)
        } else {
          console.log('Storage bucket created successfully')
        }
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error)
    }
  },

  /**
   * Upload a file to Supabase Storage
   * @param file - The file to upload
   * @param folder - Optional folder path (e.g., 'tasks', 'materials')
   * @returns Upload result with file path
   */
  async uploadFile(file: File, folder: string = 'materials'): Promise<UploadResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { path: '', error: 'User not authenticated' }
      }

      // Create a unique file path: userId/folder/timestamp-filename
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${user.id}/${folder}/${timestamp}-${sanitizedFileName}`

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading file:', error)
        return { path: '', error: error.message }
      }

      return { path: data.path }
    } catch (error) {
      console.error('Unexpected error uploading file:', error)
      return { 
        path: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * Get a signed URL for file download/preview (valid for 1 hour)
   * @param filePath - The path to the file in storage
   * @returns Signed URL or null if error
   */
  async getSignedUrl(filePath: string): Promise<string | null> {
    try {
      if (!filePath) {
        console.error('No file path provided')
        return null
      }

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Unexpected error creating signed URL:', error)
      return null
    }
  },

  /**
   * Get multiple signed URLs at once
   * @param filePaths - Array of file paths
   * @returns Array of signed URLs (null for failed ones)
   */
  async getSignedUrls(filePaths: string[]): Promise<(string | null)[]> {
    try {
      const urls = await Promise.all(
        filePaths.map(path => this.getSignedUrl(path))
      )
      return urls
    } catch (error) {
      console.error('Error getting multiple signed URLs:', error)
      return filePaths.map(() => null)
    }
  },

  /**
   * Delete a file from storage
   * @param filePath - The path to the file to delete
   * @returns Success boolean
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (!filePath) {
        return false
      }

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath])

      if (error) {
        console.error('Error deleting file:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error deleting file:', error)
      return false
    }
  },

  /**
   * Delete multiple files at once
   * @param filePaths - Array of file paths to delete
   * @returns Success boolean
   */
  async deleteFiles(filePaths: string[]): Promise<boolean> {
    try {
      if (!filePaths || filePaths.length === 0) {
        return true
      }

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filePaths)

      if (error) {
        console.error('Error deleting files:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error deleting files:', error)
      return false
    }
  },

  /**
   * Get file type from filename
   * @param fileName - The name of the file
   * @returns File type category
   */
  getFileType(fileName: string): 'pdf' | 'image' | 'document' | 'presentation' | 'note' | 'other' {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      return 'image'
    } else if (extension === 'pdf') {
      return 'pdf'
    } else if (['doc', 'docx'].includes(extension)) {
      return 'document'
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'presentation'
    } else if (['txt', 'md'].includes(extension)) {
      return 'note'
    }
    
    return 'other'
  },

  /**
   * Get MIME type from filename
   * @param fileName - The name of the file
   * @returns MIME type string
   */
  getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
    }
    
    return mimeTypes[extension] || 'application/octet-stream'
  }
}

// Initialize bucket on module load
storageService.initializeBucket().catch(console.error)
