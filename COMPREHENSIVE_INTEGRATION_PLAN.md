# 🔄 Comprehensive Integration Improvement Plan

## 📋 Overview

This document outlines the complete integration improvements for Task Manager, Material Manager, and Study Planner with Pomodoro Timer.

---

## 🎯 Goals

1. **Auto-sync files** → Task uploads auto-save to Material Manager
2. **Dynamic data fetching** → Always fetch fresh task data
3. **Bidirectional completion** → Complete event = complete task
4. **Pomodoro Timer** → Replace simple timer with 25/5 intervals
5. **Dynamic time grid** → Scrollable 6 AM - 11 PM timetable
6. **Settings integration** → Customizable Pomodoro intervals

---

## 🗄️ Database Schema Updates

### 1. Add `linked_task_id` to Materials Table

```sql
-- Add linked_task_id column to materials table
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_materials_linked_task_id 
  ON materials(linked_task_id)
  WHERE linked_task_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN materials.linked_task_id IS 'Reference to the task this material was uploaded with';
```

### 2. Add Pomodoro Settings to User Settings

```sql
-- Add pomodoro_settings column to user_settings table (if exists)
-- Or store in existing settings JSONB column

-- Example structure:
{
  "pomodoro": {
    "workDuration": 25,
    "shortBreak": 5,
    "longBreak": 15,
    "sessionsUntilLongBreak": 4,
    "autoStartBreaks": true,
    "autoStartPomodoros": false
  }
}
```

---

## 🔧 Implementation Steps

### Phase 1: Database & Schema (Day 1)

**Files to create:**
- `supabase/migrations/COMPREHENSIVE_INTEGRATION.sql`

**Tasks:**
- [ ] Add `linked_task_id` to materials
- [ ] Create indexes
- [ ] Update RLS policies
- [ ] Add Pomodoro settings structure

### Phase 2: File Upload Integration (Day 2)

**Files to update:**
- `src/components/modals/TaskModal.tsx`
- `src/services/taskFilesService.ts`
- `src/contexts/StudyPlannerContext.tsx`

**Tasks:**
- [ ] Auto-create material when file uploaded to task
- [ ] Link material to task via `linked_task_id`
- [ ] Sync to Material Manager
- [ ] Update Material Manager to show task-linked materials

### Phase 3: Dynamic Data Fetching (Day 3)

**Files to update:**
- `src/components/modals/StudySessionModal.tsx`
- `src/components/modals/ScheduleEventModal.tsx`

**Tasks:**
- [ ] Remove cached data usage
- [ ] Implement fresh data fetching on modal open
- [ ] Add loading states
- [ ] Handle data refresh

### Phase 4: Pomodoro Timer (Day 4)

**Files to create:**
- `src/components/features/PomodoroTimerIntegrated.tsx`
- `src/hooks/usePomodoro.ts`

**Files to update:**
- `src/components/modals/StudySessionModal.tsx`
- `src/components/features/Settings.tsx`

**Tasks:**
- [ ] Create Pomodoro hook with 25/5 intervals
- [ ] Add break notifications
- [ ] Integrate with Settings
- [ ] Replace simple timer in StudySessionModal
- [ ] Auto-update progress on completion

### Phase 5: Dynamic Time Grid (Day 5)

**Files to update:**
- `src/components/features/ScheduleView.tsx`
- `src/components/features/DynamicScheduleView.tsx` (if using)

**Tasks:**
- [ ] Implement scrollable time grid (6 AM - 11 PM)
- [ ] Add current time indicator
- [ ] Optimize rendering for performance
- [ ] Add smooth scrolling to current time

### Phase 6: Bidirectional Sync (Day 6)

**Files to update:**
- `src/contexts/StudyPlannerContext.tsx`
- `src/services/dataSyncService.ts`

**Tasks:**
- [ ] Complete event → complete task
- [ ] Complete task → complete event
- [ ] Update progress bidirectionally
- [ ] Add conflict resolution

### Phase 7: Testing & Polish (Day 7)

**Tasks:**
- [ ] Test all integrations
- [ ] Fix bugs
- [ ] Optimize performance
- [ ] Update documentation

---

## 📊 Data Flow Diagrams

### File Upload Flow

```
User uploads file to Task
    ↓
Save to task_files table
    ↓
Auto-create entry in materials table
    ↓
Set linked_task_id = task.id
    ↓
Material appears in:
  - Task detail view
  - Material Manager
```

### Pomodoro Session Flow

```
User starts Pomodoro (25 min)
    ↓
Timer counts down
    ↓
Work session complete
    ↓
Auto-start 5 min break
    ↓
Break complete
    ↓
Update task progress (+10%)
    ↓
Update event status
    ↓
Award XP
```

### Event-Task Sync Flow

```
User opens event modal
    ↓
Fetch fresh task data from Supabase
    ↓
Load files, notes, materials
    ↓
Display in modal
    ↓
User completes session
    ↓
Update event status → completed
    ↓
Update task status → completed
    ↓
Sync to Supabase
    ↓
Refresh all views
```

---

## 🎨 UI/UX Improvements

### 1. Pomodoro Timer Display

```
┌─────────────────────────────────┐
│  🍅 Pomodoro Timer              │
│                                 │
│        25:00                    │
│     Work Session                │
│                                 │
│  [Pause]  [Skip]  [Stop]       │
│                                 │
│  Session 1 of 4                 │
│  ●●○○ (2 more until long break) │
└─────────────────────────────────┘
```

### 2. Dynamic Time Grid

```
┌─────────────────────────────────┐
│  6:00 AM  ├─────────────────────┤
│  7:00 AM  ├─────────────────────┤
│  8:00 AM  ├─────────────────────┤
│  9:00 AM  ├──[Event]────────────┤ ← Current time indicator
│ 10:00 AM  ├─────────────────────┤
│ 11:00 AM  ├─────────────────────┤
│           ⋮                      │
│ 11:00 PM  ├─────────────────────┤
└─────────────────────────────────┘
```

### 3. Material Manager Integration

```
┌─────────────────────────────────┐
│  Material Manager               │
│                                 │
│  📄 Study Notes.pdf             │
│     Linked to: Math Assignment  │
│     [View] [Download]           │
│                                 │
│  📊 Data Analysis.xlsx          │
│     Linked to: Research Task    │
│     [View] [Download]           │
└─────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### 1. Pomodoro Hook

```typescript
// src/hooks/usePomodoro.ts

interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreak: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

interface PomodoroState {
  timeRemaining: number; // seconds
  isActive: boolean;
  isPaused: boolean;
  currentSession: number;
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  totalSessions: number;
}

export function usePomodoro(settings: PomodoroSettings) {
  const [state, setState] = useState<PomodoroState>({
    timeRemaining: settings.workDuration * 60,
    isActive: false,
    isPaused: false,
    currentSession: 1,
    sessionType: 'work',
    totalSessions: 0
  });
  
  // Timer logic
  // Session transitions
  // Notifications
  // Progress tracking
  
  return {
    ...state,
    start,
    pause,
    resume,
    stop,
    skip,
    reset
  };
}
```

### 2. Auto-Material Creation

```typescript
// In TaskModal when file is uploaded

const handleFileUpload = async (file: File, taskId: string) => {
  // 1. Upload to task_files
  const taskFile = await uploadTaskFile(userId, taskId, file);
  
  // 2. Auto-create material
  const material = await addMaterial({
    title: file.name,
    type: getFileType(file.name),
    fileName: file.name,
    fileSize: file.size,
    filePath: taskFile.file_path,
    linked_task_id: taskId, // ← Link to task
    tags: ['task-upload', 'auto-created']
  });
  
  // 3. Sync to Supabase
  await dataSyncService.syncMaterial(material, userId, 'insert');
  
  return { taskFile, material };
};
```

### 3. Dynamic Data Fetching

```typescript
// In StudySessionModal

const loadEventData = async () => {
  if (!eventId) return;
  
  setIsLoading(true);
  
  try {
    // 1. Fetch event from Supabase (fresh data)
    const { data: eventData } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    setEvent(eventData);
    
    // 2. If task linked, fetch fresh task data
    if (eventData.task_id) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', eventData.task_id)
        .single();
      
      setTask(taskData);
      
      // 3. Fetch related data
      const [files, notes, materials] = await Promise.all([
        getTaskFiles(taskData.id),
        getTaskNotes(taskData.id),
        getMaterialsByTaskId(taskData.id) // ← New function
      ]);
      
      setUploadedFiles(files);
      setTaskNotes(notes);
      setMaterials(materials);
    }
  } catch (error) {
    console.error('Error loading event data:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Bidirectional Completion

```typescript
// In StudyPlannerContext

const completeScheduleEvent = async (eventId: string) => {
  const event = state.scheduleEvents.find(e => e.id === eventId);
  if (!event) return;
  
  // 1. Update event
  const updatedEvent = {
    ...event,
    status: 'completed',
    completedAt: new Date().toISOString()
  };
  
  updateScheduleEvent(updatedEvent);
  
  // 2. If task linked, complete task too
  if (event.taskId) {
    const task = state.tasks.find(t => t.id === event.taskId);
    if (task) {
      const updatedTask = {
        ...task,
        completed: true,
        status: 'completed',
        progress: 100,
        updatedAt: new Date().toISOString()
      };
      
      updateTask(updatedTask);
      
      // 3. Sync both to Supabase
      await Promise.all([
        dataSyncService.syncScheduleEvent(updatedEvent, user.id, 'update'),
        dataSyncService.syncTask(updatedTask, user.id, 'update')
      ]);
    }
  }
  
  // 4. Award XP
  updateUserStats({ xp: state.userStats.xp + 20 });
};
```

---

## 📝 File Structure

```
src/
├── components/
│   ├── features/
│   │   ├── PomodoroTimerIntegrated.tsx (NEW)
│   │   ├── ScheduleView.tsx (UPDATE)
│   │   └── MaterialsManager.tsx (UPDATE)
│   └── modals/
│       ├── StudySessionModal.tsx (UPDATE - Add Pomodoro)
│       └── TaskModal.tsx (UPDATE - Auto-create materials)
├── hooks/
│   └── usePomodoro.ts (NEW)
├── services/
│   ├── taskFilesService.ts (UPDATE)
│   └── materialService.ts (NEW)
├── contexts/
│   └── StudyPlannerContext.tsx (UPDATE)
└── supabase/
    └── migrations/
        └── COMPREHENSIVE_INTEGRATION.sql (NEW)
```

---

## ✅ Testing Checklist

### File Upload Integration
- [ ] Upload file to task
- [ ] Verify material created in Material Manager
- [ ] Check `linked_task_id` is set
- [ ] View file from both Task and Material Manager
- [ ] Delete task → material unlinked

### Pomodoro Timer
- [ ] Start 25-minute work session
- [ ] Timer counts down correctly
- [ ] Auto-start 5-minute break
- [ ] Complete 4 sessions → long break
- [ ] Pause/resume works
- [ ] Skip session works
- [ ] Settings customization works

### Dynamic Data Fetching
- [ ] Open event modal → fresh data loaded
- [ ] Update task → changes reflect in event modal
- [ ] No stale data displayed
- [ ] Loading states show correctly

### Bidirectional Sync
- [ ] Complete event → task completes
- [ ] Complete task → event completes
- [ ] Progress syncs both ways
- [ ] XP awarded correctly

### Dynamic Time Grid
- [ ] Scrollable 6 AM - 11 PM
- [ ] Current time indicator visible
- [ ] Smooth scrolling
- [ ] Events display correctly

---

## 🚀 Deployment Plan

### Week 1: Core Integration
- Days 1-3: Database, file upload, data fetching

### Week 2: Pomodoro & UI
- Days 4-5: Pomodoro timer, dynamic grid

### Week 3: Sync & Testing
- Days 6-7: Bidirectional sync, testing, polish

---

## 📊 Success Metrics

- ✅ Files uploaded to tasks appear in Material Manager
- ✅ Pomodoro timer works with 25/5 intervals
- ✅ Event completion syncs with task completion
- ✅ Time grid is scrollable and dynamic
- ✅ All data fetching is real-time
- ✅ No stale data issues
- ✅ Settings integration works
- ✅ Performance is smooth

---

**Estimated Time**: 2-3 weeks
**Complexity**: High
**Priority**: High
**Status**: 📋 Planning Complete - Ready for Implementation
