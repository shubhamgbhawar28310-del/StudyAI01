# 🚀 Quick Start: Task File Upload System

## ⚡ 3-Step Setup

### Step 1: Run SQL in Supabase (2 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy all content from `SUPABASE_SETUP.sql`
3. Paste and click **Run**
4. ✅ Done! Tables and security policies created

### Step 2: Start Your App (30 seconds)

```bash
npm run dev
```

### Step 3: Test It! (1 minute)

1. Go to your app
2. Click "Create Task"
3. Fill in task title
4. Click "Files" tab → Upload a PDF or image
5. Click "Notes" tab → Write a note
6. Click "Create Task"
7. ✅ Files and notes saved!

---

## 🎯 What You Can Do Now

### Upload Files
- Drag and drop PDFs, images, documents
- Max 5 files per task
- Max 10MB per file
- Supported: PDF, PNG, JPG, DOCX, XLSX, PPTX, TXT

### Add Notes
- Write study tips
- Add important points
- Multiple notes per task
- Optional title

### Manage Attachments
- View uploaded files
- Download files
- Delete files
- Edit notes

---

## 📁 Files You Got

### New Files Created
```
SUPABASE_SETUP.sql                      ← Database schema
src/services/taskFilesService.ts        ← File operations
src/components/FileUpload.tsx           ← Upload UI
src/components/modals/TaskModal.tsx     ← Task modal with files
TASK_FILE_UPLOAD_SETUP.md              ← Full documentation
QUICK_START_FILE_UPLOAD.md             ← This file
```

---

## 🔒 Security Built-In

- ✅ Users can only see their own files
- ✅ Row Level Security (RLS) enabled
- ✅ Automatic user authentication
- ✅ No unauthorized access possible

---

## 🧪 Quick Test

### Test File Upload
```
1. Create task → Files tab
2. Drag a PDF file
3. See file in list
4. Click "Create Task"
5. Refresh page
6. Edit task → Files tab
7. See uploaded file ✅
```

### Test Notes
```
1. Create task → Notes tab
2. Write "Important: Study chapter 5"
3. Click "Create Task"
4. Edit task → Notes tab
5. See saved note ✅
```

---

## 🐛 Common Issues

### Files not uploading?
```typescript
// Check authentication
const { data: { session } } = await supabase.auth.getSession();
console.log('Logged in:', !!session);
```

### Can't see uploaded files?
```sql
-- Run in Supabase SQL Editor
SELECT * FROM task_files WHERE user_id = auth.uid();
```

### RLS blocking access?
```sql
-- Verify RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'task_files';
```

---

## 📚 Need More Info?

- **Full Documentation**: `TASK_FILE_UPLOAD_SETUP.md`
- **Database Schema**: `SUPABASE_SETUP.sql`
- **API Reference**: See `TASK_FILE_UPLOAD_SETUP.md` → API Reference section

---

## ✅ You're Ready!

Your file upload system is:
- ✅ Secure
- ✅ User-friendly
- ✅ Production-ready
- ✅ Fully documented

Start uploading files to your tasks! 🎉

---

**Setup Time:** ~3 minutes  
**Status:** ✅ READY TO USE
