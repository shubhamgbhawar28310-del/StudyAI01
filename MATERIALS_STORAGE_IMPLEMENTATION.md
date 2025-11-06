# Materials Storage Implementation Guide

## Overview

The MaterialsManager has been refactored to use **Supabase Storage** for file persistence instead of browser IndexedDB. This provides:

- ✅ Cloud storage - files persist across devices and browsers
- ✅ Scalability - no browser storage limits
- ✅ Better performance - optimized file delivery
- ✅ User privacy - files stored under user-specific folders
- ✅ Sync status tracking - know when files are uploaded/synced

## Architecture Changes

### Before (IndexedDB)
```
User uploads file → Convert to base64 → Store in IndexedDB → Store metadata in localStorage
```

### After (Supabase Storage)
```
User uploads file → Upload to Supabase Storage → Store file path + metadata in localStorage
```

## Setup Instructions

### 1. Run the SQL Migration

Execute the migration file to create the storage bucket and policies:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/MATERIALS_STORAGE_SETUP.sql
```

Or manually:
1. Go to Supabase Dashboard → Storage
2. Create bucket named `materials`
3. Set as public bucket
4. Apply RLS policies (see MATERIALS_STORAGE_SETUP.sql)

### 2. Verify Bucket Access

Test that the bucket is accessible:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM storage.buckets WHERE name = 'materials';
```

### 3. Test Upload

1. Log in to your app
2. Go to Materials Manager
3. Click "Upload" button
4. Select a file (PDF, image, document, etc.)
5. Watch the upload progress
6. Verify file appears with "uploaded ✅" status

### 4. Verify in Supabase Dashboard

1. Go to Storage → materials bucket
2. You should see folders named by user ID
3. Inside each folder, files are named: `{materialId}-{filename}`

## File Structure

```
materials/
  └── {userId}/
      ├── abc123-document.pdf
      ├── def456-image.png
      └── ghi789-presentation.pptx
```

## Features

### Upload Progress
- Real-time progress indicator during upload
- Shows percentage complete
- Handles multiple file uploads

### Upload Status
- **Uploading** 🔄 - File is being uploaded
- **Uploaded** ✅ - File successfully uploaded to Supabase
- **Error** ❌ - Upload failed
- **Pending** ⏳ - Queued for upload (future feature)

### File Operations

#### View File
- Downloads file from Supabase
- Opens in new browser tab
- Supports all file types

#### Download File
- Downloads file from Supabase
- Saves to user's downloads folder
- Preserves original filename

#### Delete File
- Removes file from Supabase Storage
- Deletes metadata from localStorage
- Confirms before deletion

### File Type Detection
Automatically detects file types:
- **PDF**: `.pdf` files
- **Image**: `.jpg`, `.png`, `.gif`, `.webp`, `.svg`
- **Document**: `.doc`, `.docx`, `.xls`, `.xlsx`
- **Presentation**: `.ppt`, `.pptx`
- **Note**: `.txt`, `.md`

### File Size Limits
- Maximum file size: **100MB**
- Maximum files per upload: **10 files**
- Validates before upload

## Error Handling

### Upload Errors
- File too large (>100MB)
- Network errors
- Authentication errors
- Storage quota exceeded
- Invalid file type

### Download Errors
- File not found
- Network errors
- Permission errors

### Delete Errors
- File not found
- Permission errors
- Network errors

## Migration from IndexedDB

### Automatic Fallback
The system maintains backward compatibility:
- Old files in IndexedDB remain accessible
- New uploads go to Supabase Storage
- No data loss during transition

### Manual Migration (Optional)
To migrate existing IndexedDB files to Supabase:

1. Users can re-upload important files
2. Or implement a migration script:

```typescript
// Example migration function
async function migrateIndexedDBToSupabase(userId: string) {
  const materials = state.materials.filter(m => m.content && !m.filePath)
  
  for (const material of materials) {
    try {
      // Convert base64 to Blob
      const byteString = atob(material.content!)
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab])
      const file = new File([blob], material.fileName || material.title)
      
      // Upload to Supabase
      const { url, path } = await materialStorageService.uploadFile(
        userId,
        material.id,
        file
      )
      
      // Update material
      updateMaterial({
        ...material,
        filePath: path,
        supabaseUrl: url,
        uploadStatus: 'uploaded',
        content: undefined // Remove old content
      })
      
      // Remove from IndexedDB
      await indexedDBStorage.removeItem(material.id)
    } catch (error) {
      console.error('Migration failed for:', material.title, error)
    }
  }
}
```

## Storage Quotas

### Supabase Free Tier
- **Storage**: 1GB included
- **Bandwidth**: 2GB/month
- **File uploads**: Unlimited

### Upgrade Options
If you exceed free tier:
- **Pro Plan**: $25/month - 100GB storage
- **Pay-as-you-go**: $0.021/GB/month

## Security

### Row Level Security (RLS)
- Users can only access their own files
- Files stored under user-specific folders
- Policies enforce user isolation

### File Privacy
- Public bucket for easy access
- Or use signed URLs for private files
- Configure in MATERIALS_STORAGE_SETUP.sql

### File Validation
- File size limits enforced
- File type validation
- Malicious file detection (recommended for production)

## Performance Optimization

### Caching
- Browser caches downloaded files
- Reduces repeated downloads
- Improves viewing performance

### Lazy Loading
- Files loaded on-demand
- Metadata loaded immediately
- Reduces initial load time

### Batch Operations
- Multiple files uploaded in parallel
- Progress tracked individually
- Efficient error handling

## Troubleshooting

### Upload Fails
1. Check user is authenticated
2. Verify bucket exists and is accessible
3. Check RLS policies are correct
4. Verify file size is under 100MB
5. Check network connection

### Files Not Visible
1. Check user ID matches folder name
2. Verify RLS policies allow SELECT
3. Check bucket is public or has correct policies
4. Verify file path is correct

### Download Fails
1. Check file exists in Supabase Storage
2. Verify file path is correct
3. Check network connection
4. Verify user has permission

### Delete Fails
1. Check file exists
2. Verify user owns the file
3. Check RLS policies allow DELETE
4. Verify network connection

## API Reference

### MaterialStorageService

```typescript
// Upload file
await materialStorageService.uploadFile(
  userId: string,
  materialId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string }>

// Download file
await materialStorageService.downloadFile(
  filePath: string
): Promise<Blob>

// Delete file
await materialStorageService.deleteFile(
  filePath: string
): Promise<void>

// Get signed URL (for private files)
await materialStorageService.getSignedUrl(
  filePath: string,
  expiresIn?: number
): Promise<string>

// Check bucket access
await materialStorageService.checkBucketAccess(): Promise<boolean>
```

### Material Interface

```typescript
interface Material {
  id: string
  title: string
  description?: string
  type: 'note' | 'pdf' | 'image' | 'document' | 'presentation' | 'link' | 'other'
  fileName?: string
  fileSize?: number
  filePath?: string // Supabase Storage path
  supabaseUrl?: string // Public URL
  uploadStatus?: 'uploading' | 'uploaded' | 'error' | 'pending'
  uploadProgress?: number
  tags?: string[]
  createdAt: string
  updatedAt: string
}
```

## Future Enhancements

### Planned Features
- [ ] Offline mode with IndexedDB fallback
- [ ] Automatic retry on upload failure
- [ ] File versioning
- [ ] Shared materials between users
- [ ] File preview thumbnails
- [ ] Bulk download as ZIP
- [ ] File search by content (OCR)
- [ ] Automatic file organization by subject
- [ ] Integration with Google Drive/Dropbox

### Performance Improvements
- [ ] CDN integration for faster delivery
- [ ] Image optimization and compression
- [ ] Progressive file loading
- [ ] Background upload queue
- [ ] Upload resume on network failure

## Support

For issues or questions:
1. Check this guide first
2. Review MATERIALS_STORAGE_SETUP.md
3. Check Supabase Dashboard logs
4. Review browser console for errors
5. Test with different file types/sizes

## Summary

The new Supabase Storage implementation provides:
- ✅ Reliable cloud storage
- ✅ Better user experience
- ✅ Scalable architecture
- ✅ Enhanced security
- ✅ Real-time sync status
- ✅ Cross-device access

All while maintaining backward compatibility with existing IndexedDB files.
