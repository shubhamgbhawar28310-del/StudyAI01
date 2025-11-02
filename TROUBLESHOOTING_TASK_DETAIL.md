# 🔧 Troubleshooting: Task Detail View Setup

## ❌ Error: "column task_id does not exist"

### Problem
You got this error when running the SQL setup:
```
ERROR: 42703: column "task_id" does not exist
```

### Root Cause
The error occurred because the cascading delete function tried to reference `task_id` in the `tasks` table, but the `tasks` table uses `id` as its primary key column (not `task_id`).

### ✅ Solution

Use the **FIXED** SQL script: `TASK_DETAIL_SETUP_FIXED.sql`

This script:
1. ✅ Correctly references `tasks.id` (not `task_id`)
2. ✅ Uses TEXT type for `task_id` in `materials` and `task_notes` tables
3. ✅ Includes proper error handling
4. ✅ Checks if tables exist before operations
5. ✅ Drops existing policies to avoid conflicts

---

## 🚀 Quick Fix Steps

### Step 1: Use the Fixed SQL Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open file: **`TASK_DETAIL_SETUP_FIXED.sql`**
3. Copy all content
4. Paste in SQL Editor
5. Click **Run**
6. ✅ Should complete without errors!

### Step 2: Verify Setup

Run these verification queries in Supabase SQL Editor:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'materials', 'task_notes');

-- Expected result: 3 rows (tasks, materials, task_notes)
```

```sql
-- Check if new columns were added to tasks
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('priority', 'due_date', 'status');

-- Expected result: 3 rows (priority, due_date, status)
```

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('materials', 'task_notes');

-- Expected result: Both should show rowsecurity = true
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "relation already exists"

**Error:**
```
ERROR: relation "materials" already exists
```

**Solution:**
The table already exists from a previous run. You have two options:

**Option A: Drop and recreate (⚠️ This deletes all data)**
```sql
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.task_notes CASCADE;
-- Then run the fixed SQL script again
```

**Option B: Skip table creation**
Comment out the CREATE TABLE statements in the SQL script and only run the ALTER TABLE, policies, and trigger parts.

---

### Issue 2: "policy already exists"

**Error:**
```
ERROR: policy "Users can view their own materials" already exists
```

**Solution:**
The fixed SQL script already includes `DROP POLICY IF EXISTS` statements. If you still get this error, manually drop the policies:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can insert their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.materials;

DROP POLICY IF EXISTS "Users can view their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can insert their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can update their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can delete their own task notes" ON public.task_notes;

-- Then run the fixed SQL script
```

---

### Issue 3: "function already exists"

**Error:**
```
ERROR: function "delete_task_materials" already exists
```

**Solution:**
The fixed SQL script uses `CREATE OR REPLACE FUNCTION` which should handle this. If you still get errors:

```sql
-- Drop existing functions
DROP FUNCTION IF EXISTS delete_task_materials() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Then run the fixed SQL script
```

---

### Issue 4: "trigger already exists"

**Error:**
```
ERROR: trigger "delete_task_materials_trigger" already exists
```

**Solution:**
The fixed SQL script includes `DROP TRIGGER IF EXISTS` statements. If you still get errors:

```sql
-- Drop existing triggers
DROP TRIGGER IF EXISTS delete_task_materials_trigger ON public.tasks;
DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;
DROP TRIGGER IF EXISTS update_task_notes_updated_at ON public.task_notes;

-- Then run the fixed SQL script
```

---

### Issue 5: Tasks table doesn't exist

**Error:**
```
ERROR: relation "tasks" does not exist
```

**Solution:**
Your tasks table hasn't been created yet. You need to create it first. Check your existing migrations or create the tasks table:

```sql
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🧪 Testing After Setup

### Test 1: Check Tables
```sql
-- Should return 3 rows
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'materials', 'task_notes');
```

### Test 2: Check Columns
```sql
-- Should return priority, due_date, status
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('priority', 'due_date', 'status');
```

### Test 3: Check RLS
```sql
-- Both should show rowsecurity = true
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('materials', 'task_notes');
```

### Test 4: Check Policies
```sql
-- Should return 8 policies (4 for materials, 4 for task_notes)
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename IN ('materials', 'task_notes');
```

### Test 5: Check Triggers
```sql
-- Should return 3 triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('tasks', 'materials', 'task_notes');
```

---

## 🎯 Clean Slate (Nuclear Option)

If nothing works and you want to start fresh:

⚠️ **WARNING: This will delete ALL data in these tables!**

```sql
-- Drop everything
DROP TRIGGER IF EXISTS delete_task_materials_trigger ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials CASCADE;
DROP TRIGGER IF EXISTS update_task_notes_updated_at ON public.task_notes CASCADE;

DROP FUNCTION IF EXISTS delete_task_materials() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS public.task_notes CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;

-- Remove columns from tasks (optional)
ALTER TABLE public.tasks 
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS due_date,
DROP COLUMN IF EXISTS status;

-- Now run TASK_DETAIL_SETUP_FIXED.sql
```

---

## 📞 Still Having Issues?

### Check Supabase Logs
1. Go to **Supabase Dashboard** → **Logs**
2. Look for errors related to your SQL execution
3. Check the error message details

### Verify Permissions
```sql
-- Check if you have the right permissions
SELECT current_user, current_database();

-- Check if you can create tables
SELECT has_table_privilege('public.tasks', 'INSERT');
```

### Check Existing Schema
```sql
-- See all tables in your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- See all columns in tasks table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

---

## ✅ Success Checklist

After running the fixed SQL script, verify:

- [ ] `materials` table exists
- [ ] `task_notes` table exists
- [ ] `tasks` table has `priority`, `due_date`, `status` columns
- [ ] RLS is enabled on `materials` and `task_notes`
- [ ] 8 RLS policies exist (4 per table)
- [ ] 3 triggers exist (1 on tasks, 2 on materials/task_notes)
- [ ] 2 functions exist (delete_task_materials, update_updated_at_column)
- [ ] Indexes are created
- [ ] No errors in Supabase logs

---

## 🎉 Next Steps

Once setup is complete:

1. ✅ Test the Task Detail View in your app
2. ✅ Click on a task card
3. ✅ Modal should open with task details
4. ✅ All tabs should work (Details, Files, Notes)

---

**Last Updated:** November 2, 2025  
**Status:** ✅ FIXED & TESTED
