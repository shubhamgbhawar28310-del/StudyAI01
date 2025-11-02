# Quick Reference Card

## 🚀 Quick Start (3 Steps)

1. **Run Migration**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/migrations/COMPREHENSIVE_INTEGRATION.sql
   ```

2. **Verify Setup**
   ```sql
   SELECT COUNT(*) FROM materials;
   SELECT COUNT(*) FROM user_settings;
   ```

3. **Test Features**
   - Upload file to task → Check Material Manager
   - Start Pomodoro → Complete session → Check progress
   - Open Study Planner → Verify scrollable schedule

---

## 📦 What's New?

| Feature | What It Does | Where to Find It |
|---------|-------------|------------------|
| **Auto Material Linking** | Files uploaded to tasks auto-create materials | Task Detail → Upload File |
| **Pomodoro Timer** | 25min work + 5min break cycles | Study Session Modal → Timer Tab |
| **Dynamic Schedule** | Scrollable 6AM-11PM time grid | Study Planner |
| **Fresh Data Loading** | Always shows current task state | Study Session Modal → Refresh Button |
| **Progress Sync** | Pomodoros auto-update task progress | Automatic |

---

## 🎯 Common Tasks

### Upload File to Task
```
1. Open/Create Task
2. Click "Upload File"
3. Select file
4. File appears in:
   - Task Detail (Files tab)
   - Material Manager (auto-linked)
```

### Start Pomodoro Session
```
1. Go to Study Planner
2. Click any event
3. Click "Timer" tab
4. Click "Start"
5. Work for 25 minutes
6. Take 5 minute break
7. Repeat
```

### Create Event in Schedule
```
1. Go to Study Planner
2. Click any empty time slot
3. Fill in event details
4. Link to task (optional)
5. Save
```

### View Task Progress
```
1. Open event in Study Planner
2. Click "Progress" tab
3. See:
   - Current progress %
   - Task status
   - Completion rate
```

---

## 🔧 Settings

### Customize Pomodoro
```
Settings → Study Preferences
- Work Duration: 25 min (default)
- Short Break: 5 min (default)
- Long Break: 15 min (default)
- Auto-start Breaks: ON/OFF
```

### Schedule View
```
Study Planner → View Controls
- View Mode: Day / Week
- Auto-scroll: Enabled
- Time Range: 6 AM - 11 PM
```

---

## 🗄️ Database Quick Reference

### Key Tables
```sql
materials          -- Uploaded files with task links
user_settings      -- Pomodoro preferences
task_files         -- Files attached to tasks
schedule_events    -- Study sessions with Pomodoro tracking
```

### Key Functions
```sql
get_event_with_task_data(event_id, user_id)
  → Returns: { event, task, files, notes, materials }

complete_study_session(event_id, user_id, duration, pomodoro_count)
  → Updates: event status, task progress, completion

auto_create_material_from_task_file()
  → Trigger: Runs on file upload
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Files not in Material Manager | Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_create_material'` |
| Pomodoro not updating progress | Verify function: `SELECT * FROM pg_proc WHERE proname = 'complete_study_session'` |
| Schedule not scrolling | Clear cache, reload page |
| Task data not refreshing | Click "Refresh Task Data" button |
| Settings not saving | Check `user_settings` table exists |

---

## 📊 Progress Calculation

```
Each Pomodoro = +10% progress
4 Pomodoros = +40% progress
10 Pomodoros = 100% (task complete)

Formula: new_progress = min(current_progress + (pomodoros * 10), 100)
```

---

## 🎨 Status Indicators

### Event Status Colors
- 🔵 **Blue** = Scheduled
- 🟡 **Yellow** = In Progress
- 🟢 **Green** = Completed
- 🔴 **Red** = Missed

### Task Status
- **Pending** = Not started
- **In Progress** = Currently working
- **Completed** = Done
- **Missed** = Deadline passed

---

## ⌨️ Keyboard Shortcuts (Future)

```
Space     - Start/Pause Pomodoro
Esc       - Close modal
N         - New event
T         - New task
R         - Refresh data
```

---

## 📱 Mobile Tips

1. **Schedule View**: Swipe to navigate weeks
2. **Pomodoro Timer**: Large touch targets
3. **File Upload**: Use camera or gallery
4. **Quick Actions**: Swipe gestures

---

## 🔗 Related Files

- **Full Documentation**: `COMPREHENSIVE_INTEGRATION_GUIDE.md`
- **Setup Guide**: `SETUP_INSTRUCTIONS.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Database Migration**: `supabase/migrations/COMPREHENSIVE_INTEGRATION.sql`

---

## 💡 Pro Tips

1. **Batch Upload**: Upload multiple files at once to a task
2. **Link Materials**: Attach same material to multiple tasks
3. **Custom Durations**: Adjust Pomodoro length for different tasks
4. **Auto-breaks**: Enable for seamless workflow
5. **Refresh Often**: Keep data current with refresh button
6. **Status Tracking**: Use status dots to monitor progress
7. **Time Blocking**: Click schedule slots for quick planning

---

## 📞 Need Help?

1. Check troubleshooting section above
2. Review full documentation
3. Check browser console for errors
4. Verify database migration completed
5. Test with simple example first

---

## ✅ Quick Checklist

Before using:
- [ ] Migration run successfully
- [ ] Tables created (materials, user_settings)
- [ ] Functions exist (3 total)
- [ ] Trigger active (auto_create_material)
- [ ] RLS policies enabled

After setup:
- [ ] Upload test file
- [ ] Start test Pomodoro
- [ ] Create test event
- [ ] Verify data syncs
- [ ] Check Material Manager

---

**Version**: 1.0.0  
**Last Updated**: November 2, 2025  
**Status**: Production Ready ✅

---

## 🎯 One-Liner Summary

**Upload files → Auto-create materials → Start Pomodoro → Track progress → Complete tasks → All synced automatically!** 🚀
