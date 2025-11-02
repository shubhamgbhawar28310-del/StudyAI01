# System Architecture Diagram

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Task Manager │  │Study Planner │  │Material Mgr  │        │
│  │              │  │              │  │              │        │
│  │ - Create     │  │ - Schedule   │  │ - View Files │        │
│  │ - Upload     │  │ - Pomodoro   │  │ - Download   │        │
│  │ - Progress   │  │ - Track Time │  │ - Organize   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         StudyPlannerContext (State Management)         │   │
│  │                                                        │   │
│  │  - Tasks State                                         │   │
│  │  - Events State                                        │   │
│  │  - Materials State                                     │   │
│  │  - Settings State                                      │   │
│  │  - Sync Functions                                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Task Service │  │ Event Service│  │Material Svc  │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  tasks   │  │ schedule │  │materials │  │  user_   │      │
│  │          │  │  events  │  │          │  │ settings │      │
│  │ - id     │  │ - id     │  │ - id     │  │ - id     │      │
│  │ - title  │  │ - title  │  │ - title  │  │ - user   │      │
│  │ - status │  │ - task_id│  │ - linked │  │ - pomod  │      │
│  │ - prog   │  │ - status │  │   _task  │  │   _work  │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘      │
│       │             │             │                             │
│       └─────────────┼─────────────┘                             │
│                     │                                           │
│  ┌──────────────────┴────────────────────────────────────┐    │
│  │              Database Functions & Triggers            │    │
│  │                                                        │    │
│  │  1. auto_create_material_from_task_file()            │    │
│  │     → Trigger on task_files INSERT                    │    │
│  │                                                        │    │
│  │  2. get_event_with_task_data(event_id, user_id)      │    │
│  │     → Returns complete event + task data              │    │
│  │                                                        │    │
│  │  3. complete_study_session(...)                       │    │
│  │     → Syncs event completion to task progress         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. File Upload Flow

```
┌─────────────┐
│    User     │
│ Uploads File│
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  TaskDetailModal    │
│  - File selected    │
│  - Upload initiated │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  taskFilesService   │
│  - Upload to        │
│    Supabase Storage │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   task_files        │
│   INSERT triggered  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ auto_create_material_from_      │
│ task_file() TRIGGER             │
│                                 │
│ 1. Get task details             │
│ 2. Detect file type             │
│ 3. Create material entry        │
│ 4. Link to task                 │
│ 5. Set material_id on file      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────┐
│    materials        │
│    Row created      │
│    linked_task_id   │
│    = task.id        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Material Manager   │
│  Shows new file     │
│  with task link     │
└─────────────────────┘
```

---

### 2. Pomodoro Session Flow

```
┌─────────────┐
│    User     │
│ Starts      │
│ Pomodoro    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  PomodoroTimer      │
│  - 25 min work      │
│  - 5 min break      │
│  - Track count      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Timer Completes    │
│  - Work session     │
│  - pomodoro_count++ │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ onSessionComplete() │
│ callback triggered  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ complete_study_session()        │
│ Database Function               │
│                                 │
│ 1. Update event:                │
│    - status = 'completed'       │
│    - completed_at = NOW()       │
│    - pomodoro_count = N         │
│                                 │
│ 2. Update task:                 │
│    - progress += (N * 10)%      │
│    - status = 'in_progress'     │
│    - if progress >= 100:        │
│      status = 'completed'       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  UI Updates         │
│  - Task progress    │
│  - Event status     │
│  - XP gained        │
└─────────────────────┘
```

---

### 3. Event Open Flow

```
┌─────────────┐
│    User     │
│ Clicks Event│
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ StudySessionModal   │
│ Opens               │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ loadEventData()                 │
│                                 │
│ 1. Find event by ID             │
│ 2. Check if has task_id         │
│ 3. Call RPC function            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ get_event_with_task_data()      │
│ Database Function               │
│                                 │
│ Returns JSON:                   │
│ {                               │
│   event: { ... },               │
│   task: {                       │
│     id, title, description,     │
│     progress, status,           │
│     files: [...],               │
│     notes: [...],               │
│     materials: [...]            │
│   }                             │
│ }                               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Modal Displays     │
│  - Event details    │
│  - Task details     │
│  - Files (fresh)    │
│  - Notes (fresh)    │
│  - Materials        │
│  - Pomodoro timer   │
└─────────────────────┘
```

---

## 🗂️ Component Hierarchy

```
Dashboard
│
├── DashboardSidebar
│   └── Navigation Links
│
├── DashboardOverview
│   ├── Quick Stats Cards
│   ├── Quick Actions
│   ├── TaskManager (compact)
│   ├── DynamicScheduleView (compact)
│   └── MaterialsManager (compact)
│
├── TaskManager (full)
│   ├── TaskList
│   ├── TaskFilters
│   └── TaskModal
│       ├── TaskForm
│       ├── FileUpload
│       └── NotesEditor
│
├── DynamicScheduleView (full)
│   ├── ViewControls
│   ├── TimeGrid
│   │   ├── TimeSlots (6AM-11PM)
│   │   ├── EventCards
│   │   └── CurrentTimeIndicator
│   ├── ScheduleEventModal
│   └── StudySessionModal
│       ├── Tabs
│       │   ├── Timer (PomodoroTimer)
│       │   ├── Details
│       │   ├── Files
│       │   ├── Notes
│       │   └── Progress
│       └── RefreshButton
│
├── PomodoroTimer
│   ├── TimerDisplay
│   ├── ProgressBar
│   ├── Controls (Start/Pause/Stop/Skip)
│   └── SessionStats
│
└── MaterialsManager
    ├── MaterialList
    ├── MaterialFilters
    └── MaterialCard
        ├── FilePreview
        ├── LinkedTasks
        └── Actions
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Authentication                                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Supabase Auth                                         │   │
│  │  - JWT tokens                                          │   │
│  │  - Session management                                  │   │
│  │  - auth.uid() for user identification                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 2: Row Level Security (RLS)                             │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  All tables have RLS enabled:                          │   │
│  │  - tasks: WHERE user_id = auth.uid()                   │   │
│  │  - schedule_events: WHERE user_id = auth.uid()         │   │
│  │  - materials: WHERE user_id = auth.uid()               │   │
│  │  - user_settings: WHERE user_id = auth.uid()           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 3: Function Security                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  All functions use SECURITY DEFINER:                   │   │
│  │  - Validates user_id parameter                         │   │
│  │  - Checks ownership before operations                  │   │
│  │  - Returns only user's data                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 4: Storage Security                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Supabase Storage:                                     │   │
│  │  - Private buckets                                     │   │
│  │  - Signed URLs for access                              │   │
│  │  - File type validation                                │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Relationships

```
┌──────────────┐
│    users     │
│  (Supabase)  │
└──────┬───────┘
       │
       │ 1:N
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       ▼                                             ▼
┌──────────────┐                              ┌──────────────┐
│    tasks     │                              │user_settings │
│              │                              │              │
│ - id (PK)    │                              │ - id (PK)    │
│ - user_id    │                              │ - user_id    │
│ - title      │                              │ - pomodoro_  │
│ - status     │                              │   settings   │
│ - progress   │                              └──────────────┘
└──────┬───────┘
       │
       │ 1:N
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       ▼                                             ▼
┌──────────────┐                              ┌──────────────┐
│  task_files  │                              │ schedule_    │
│              │                              │  events      │
│ - id (PK)    │                              │              │
│ - task_id    │                              │ - id (PK)    │
│ - file_path  │                              │ - task_id    │
│ - material_id│◄─────────────────────────────│ - status     │
└──────┬───────┘                              │ - pomodoro_  │
       │                                      │   count      │
       │ 1:1                                  └──────────────┘
       │
       ▼
┌──────────────┐
│  materials   │
│              │
│ - id (PK)    │
│ - user_id    │
│ - linked_    │
│   task_id    │
│ - file_path  │
└──────────────┘
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  StudyPlannerContext                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State:                                                         │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  - tasks: Task[]                                       │   │
│  │  - scheduleEvents: ScheduleEvent[]                     │   │
│  │  - materials: Material[]                               │   │
│  │  - settings: AppSettings                               │   │
│  │  - userStats: UserStats                                │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Actions:                                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  - addTask()                                           │   │
│  │  - updateTask()                                        │   │
│  │  - deleteTask()                                        │   │
│  │  - addScheduleEvent()                                  │   │
│  │  - updateScheduleEvent()                               │   │
│  │  - completeScheduleEvent()                             │   │
│  │  - addMaterial()                                       │   │
│  │  - getMaterialsByTask()                                │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Sync:                                                          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  - Auto-sync to Supabase on changes                    │   │
│  │  - Load from Supabase on mount                         │   │
│  │  - Backup to localStorage                              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Integration Points

```
Task Manager ←──────────────────→ Material Manager
     │                                    │
     │ linked_task_id                    │
     │                                    │
     └────────────┬───────────────────────┘
                  │
                  │ task_id
                  │
                  ▼
           Study Planner
                  │
                  │ event_id
                  │
                  ▼
          Pomodoro Timer
                  │
                  │ progress_update
                  │
                  ▼
           Progress Tracker
```

---

## 📱 Responsive Design Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSIVE BREAKPOINTS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mobile (< 640px)                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  - Single column layout                                │   │
│  │  - Compact cards                                       │   │
│  │  - Bottom navigation                                   │   │
│  │  - Swipe gestures                                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Tablet (640px - 1024px)                                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  - Two column layout                                   │   │
│  │  - Side navigation                                     │   │
│  │  - Medium cards                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Desktop (> 1024px)                                             │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  - Three column layout                                 │   │
│  │  - Persistent sidebar                                  │   │
│  │  - Large cards                                         │   │
│  │  - Keyboard shortcuts                                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Version**: 1.0.0  
**Last Updated**: November 2, 2025  
**Status**: Production Ready ✅
