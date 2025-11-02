# Music System Setup Guide

## 🎵 Overview
This guide will help you set up the admin-controlled music system in your Study Planner application. Only admins can upload music, while all users can listen to the uploaded songs through the floating music player.

## 📋 Prerequisites
- Supabase project set up and configured
- Authentication working in your app
- Database migrations capability

## 🚀 Setup Steps

### 1. Run Database Migration
Execute the migration to set up the music system:

```bash
# Navigate to your project directory
cd your-project-directory

# Run the migration (adjust command based on your setup)
supabase db push
# OR if using a different migration tool:
# npm run migrate
# OR manually run the SQL file in your Supabase dashboard
```

The migration file is located at: `supabase/migrations/MUSIC_SYSTEM_SETUP.sql`

### 2. Configure Admin Access
1. Open `src/services/musicService.ts`
2. Replace `'your-admin-email@example.com'` with your actual admin email
3. Also update the same email in `supabase/migrations/MUSIC_SYSTEM_SETUP.sql`
4. Re-run the migration if you've already applied it

### 3. Verify Supabase Storage Bucket
1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Verify that a `music` bucket has been created
4. Check that the bucket is set to **public** access
5. Confirm the file size limit is set to 50MB

### 4. Test the System
1. Start your development server
2. Navigate to the Dashboard
3. Enable the floating music player (music note button in top-right)
4. As admin, click the menu (⋮) → "Upload Music"
5. Try uploading a small MP3 file (2-3MB)
6. Verify the file appears in the playlist
7. Test playback functionality

## 🎯 Features Included

### Upload System
- **Multi-file upload**: Upload up to 10 files at once
- **File validation**: Only MP3, WAV, OGG files allowed
- **Size limit**: 50MB per file maximum
- **Progress tracking**: Real-time upload progress
- **Error handling**: Clear error messages for failed uploads

### Music Player
- **Playback controls**: Play, pause, skip, volume control
- **Song library**: View all uploaded songs
- **Auto-metadata**: Extracts title and artist from filename
- **File management**: Delete songs with confirmation
- **Responsive design**: Works on desktop and mobile

### Database Structure
- **songs table**: Stores metadata for each music file
- **Automatic cleanup**: Removes files from storage when deleted from database
- **Public URLs**: Direct access to music files for streaming

## 🔧 Configuration Options

### File Size Limits
To change the file size limit, update the migration:
```sql
-- Change 52428800 (50MB) to your desired size in bytes
file_size_limit: 52428800
```

### Allowed File Types
To add more audio formats, update the migration:
```sql
-- Add more MIME types as needed
ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
```

### Storage Bucket Settings
- **Public access**: Required for direct audio streaming
- **Cache control**: Set to 3600 seconds (1 hour) for better performance
- **CORS**: Automatically configured for web access

## 🎵 Usage Instructions

### For Admins
1. Enable the floating music player (music note button)
2. Click the menu (⋮) in the player header
3. Select "Upload Music"
4. Choose up to 10 audio files (max 50MB each)
5. Wait for upload completion
6. Songs automatically appear in the playlist

### For Users
1. Enable the floating music player (music note button)
2. Click "Playlist" to browse available songs
3. Click on any song to select and play it
4. Use playback controls to play/pause/skip
5. Adjust volume as needed
6. Minimize player to keep it out of the way

## 🛠️ Troubleshooting

### Upload Issues
- **File too large**: Ensure files are under 50MB
- **Invalid format**: Only MP3, WAV, OGG files are supported
- **Network error**: Check internet connection and Supabase status
- **Permission error**: Verify user is authenticated

### Playback Issues
- **No audio**: Check browser audio permissions
- **Loading error**: Verify file URL is accessible
- **Slow loading**: Check file size and internet speed

### Database Issues
- **Migration failed**: Check Supabase connection and permissions
- **Table not found**: Ensure migration ran successfully
- **RLS errors**: Verify Row Level Security policies are correct

## 📁 File Structure
```
src/
├── services/
│   └── musicService.ts          # Music API functions
├── components/
│   └── features/
│       ├── MusicUpload.tsx      # Upload component
│       ├── SimpleMusicPlayer.tsx # Player component
│       └── MusicManager.tsx     # Combined manager
└── pages/
    └── Dashboard.tsx            # Updated with music tab

supabase/
└── migrations/
    └── MUSIC_SYSTEM_SETUP.sql   # Database setup
```

## 🔐 Security Features
- **Authentication required**: Only logged-in users can upload
- **File validation**: Server-side file type and size checking
- **Unique filenames**: Prevents file overwrites with UUID system
- **Row Level Security**: Database-level access control
- **Public read access**: Songs are publicly readable for streaming

## 🎉 Success Criteria
After setup, you should be able to:
- ✅ Upload MP3 files through the web interface
- ✅ See uploaded files in the music library
- ✅ Play music with full controls (play/pause/skip/volume)
- ✅ Delete songs with confirmation
- ✅ Handle errors gracefully with user feedback

## 📞 Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify Supabase dashboard for storage and database status
3. Ensure all migrations have been applied
4. Check network connectivity and authentication status

The music system is now ready for use! 🎵