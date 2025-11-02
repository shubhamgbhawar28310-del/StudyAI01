# 🎯 Study Planner - System Flow Diagrams

## 📊 Visual Architecture Overview

### 1. **High-Level System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Tasks   │  │Flashcards│  │ Pomodoro │  │ Schedule │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   REACT CONTEXT API       │
        │  (StudyPlannerContext)    │
        │                           │
        │  ┌─────────────────────┐  │
        │  │   useReducer        │  │
        │  │   (State Manager)   │  │
        │  └─────────────────────┘  │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    DATA LAYER             │
        │                           │
        │  ┌──────────┐ ┌─────────┐│
        │  │IndexedDB │ │Supabase ││
        │  │ (Local)  │ │ (Cloud) ││
        │  └──────────┘ └─────────┘│
        └───────────────────────────┘
```

---

### 2. **Task Creation Flow**

```
┌──────────────┐
│   User       │
│  Clicks      │
│ "Add Task"   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│   TaskModal Opens    │
│                      │
│  ┌────────────────┐  │
│  │ Title Input    │  │
│  │ Description    │  │
│  │ Priority       │  │
│  │ Due Date ✓     │  │ ◄── Date Validation
│  │ Due Time ✓     │  │ ◄── Time Validation
│  │ Subject        │  │
│  │ Estimate       │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Validation Check    │
│                      │
│  ✓ Title required    │
│  ✓ Date not past     │
│  ✓ Time not past     │
└──────┬───────────────┘
       │
       ├─── ❌ Invalid ──► Show Error Message
       │
       ▼ ✅ Valid
┌──────────────────────┐
│  Generate Task ID    │
│  (crypto.randomUUID) │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Dispatch Action     │
│  ADD_TASK            │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Reducer Updates     │
│  State               │
│                      │
│  tasks: [newTask,    │
│          ...oldTasks]│
└──────┬───────────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ Save to      │   │ Sync to      │
│ IndexedDB    │   │ Supabase     │
│ (Instant)    │   │ (Background) │
└──────────────┘   └──────────────┘
       │                  │
       └────────┬─────────┘
                ▼
       ┌──────────────────┐
       │  UI Re-renders   │
       │  Show new task   │
       │  Toast success   │
       └──────────────────┘
```

---

### 3. **File Upload Flow**

```
┌──────────────┐
│   User       │
│  Selects     │
│   Files      │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  File Validation     │
│                      │
│  ✓ Size < 10MB       │
│  ✓ Type allowed      │
│  ✓ Count < 5         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Read File as        │
│  Base64              │
│                      │
│  FileReader API      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Upload to Supabase  │
│                      │
│  INSERT INTO         │
│  task_files          │
│  {                   │
│    user_id,          │
│    task_id,          │
│    file_name,        │
│    file_data,        │
│    file_size         │
│  }                   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Update UI           │
│                      │
│  Show file in list   │
│  Display preview     │
│  Enable actions      │
└──────────────────────┘
```

---

### 4. **Task Detail View Flow**

```
┌──────────────┐
│   User       │
│  Clicks      │
│   Task       │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  TaskDetailModal     │
│  Opens               │
│                      │
│  taskId passed       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Load Task Data      │
│                      │
│  getTaskById(id)     │
└──────┬───────────────┘
       │
       ├─── ❌ Not Found ──► Show Error
       │
       ▼ ✅ Found
┌──────────────────────┐
│  Load Related Data   │
│                      │
│  ┌────────────────┐  │
│  │ Task Files     │  │
│  │ Task Notes     │  │
│  │ Materials      │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Display in Tabs     │
│                      │
│  ┌────────────────┐  │
│  │ Details Tab    │  │
│  │ Files Tab      │  │
│  │ Notes Tab      │  │
│  └────────────────┘  │
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  User Actions        │
│                      │
│  ┌────────────────┐  │
│  │ Edit           │──► Open Edit Mode
│  │ Complete       │──► Toggle Status
│  │ Delete         │──► Confirm & Delete
│  │ View File      │──► Open in New Tab
│  │ Download       │──► Save to Device
│  └────────────────┘  │
└──────────────────────┘
```

---

### 5. **State Management Flow**

```
┌─────────────────────────────────────────────────────────┐
│                  STUDYPLANNER CONTEXT                   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              GLOBAL STATE                         │ │
│  │                                                   │ │
│  │  tasks: Task[]                                    │ │
│  │  flashcards: Flashcard[]                          │ │
│  │  pomodoroSessions: PomodoroSession[]              │ │
│  │  scheduleEvents: ScheduleEvent[]                  │ │
│  │  materials: Material[]                            │ │
│  │  userStats: UserStats                             │ │
│  │  settings: AppSettings                            │ │
│  │  isLoading: boolean                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              ACTIONS                              │ │
│  │                                                   │ │
│  │  dispatch({ type: 'ADD_TASK', payload: task })   │ │
│  │  dispatch({ type: 'UPDATE_TASK', payload: task })│ │
│  │  dispatch({ type: 'DELETE_TASK', payload: id })  │ │
│  │  dispatch({ type: 'TOGGLE_TASK', payload: id })  │ │
│  │  ...                                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              REDUCER                              │ │
│  │                                                   │ │
│  │  switch (action.type) {                          │ │
│  │    case 'ADD_TASK':                              │ │
│  │      return {                                    │ │
│  │        ...state,                                 │ │
│  │        tasks: [action.payload, ...state.tasks]  │ │
│  │      }                                           │ │
│  │    ...                                           │ │
│  │  }                                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              HELPER FUNCTIONS                     │ │
│  │                                                   │ │
│  │  addTask(taskData)                               │ │
│  │  updateTask(task)                                │ │
│  │  deleteTask(id)                                  │ │
│  │  getTaskById(id)                                 │ │
│  │  getMaterialsByTask(taskId)                      │ │
│  │  ...                                             │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Consumed by
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    COMPONENTS                           │
│                                                         │
│  const { state, addTask, updateTask } =                │
│         useStudyPlanner()                              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │TaskMgr   │  │Flashcard │  │Pomodoro  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

### 6. **Data Synchronization Flow**

```
┌──────────────────────────────────────────────────────────┐
│                    USER ACTION                           │
│              (Create/Update/Delete)                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│              UPDATE LOCAL STATE                          │
│                                                          │
│  dispatch({ type: 'ADD_TASK', payload: task })          │
│                                                          │
│  ✅ Instant UI update (Optimistic)                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ├─────────────────┬──────────────────┐
                     │                 │                  │
                     ▼                 ▼                  ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  INDEXEDDB BACKUP    │  │  SUPABASE SYNC   │  │  UI RE-RENDER    │
│                      │  │                  │  │                  │
│  safeStorage         │  │  dataSyncService │  │  React updates   │
│  .setItem()          │  │  .syncTask()     │  │  components      │
│                      │  │                  │  │                  │
│  ✅ Local backup     │  │  ✅ Cloud sync   │  │  ✅ Show changes │
└──────────────────────┘  └────────┬─────────┘  └──────────────────┘
                                   │
                                   ├─── ✅ Success ──► Confirm
                                   │
                                   └─── ❌ Error ──► Retry/Rollback
```

---

### 7. **AI Upload & Analysis Flow**

```
┌──────────────┐
│   User       │
│  Uploads     │
│   File       │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  File Processing     │
│                      │
│  ┌────────────────┐  │
│  │ PDF            │  │
│  │ Image          │  │
│  │ Document       │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Upload to Supabase  │
│  Storage             │
│                      │
│  /tasks/user_id/     │
│    file_name         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  AI Service          │
│  Analysis            │
│                      │
│  ┌────────────────┐  │
│  │ Extract text   │  │
│  │ Identify topics│  │
│  │ Generate Q&A   │  │
│  │ Create outline │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  AI Suggestions      │
│                      │
│  ┌────────────────┐  │
│  │ 📝 Tasks       │  │
│  │ 🎴 Flashcards  │  │
│  │ 📅 Schedule    │  │
│  │ 📋 Notes       │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  User Reviews        │
│  Suggestions         │
│                      │
│  ✓ Accept            │
│  ✗ Reject            │
│  ✎ Edit              │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Add to Study        │
│  Planner             │
│                      │
│  Tasks created       │
│  Flashcards added    │
│  Schedule updated    │
└──────────────────────┘
```

---

### 8. **Pomodoro Timer Flow**

```
┌──────────────┐
│   User       │
│  Selects     │
│   Task       │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Start Pomodoro      │
│                      │
│  setCurrentPomodoro  │
│  Task(task)          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Timer Starts        │
│                      │
│  25:00 countdown     │
│                      │
│  ┌────────────────┐  │
│  │ 24:59          │  │
│  │ 24:58          │  │
│  │ ...            │  │
│  │ 00:01          │  │
│  │ 00:00 ✓        │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Session Complete    │
│                      │
│  ┌────────────────┐  │
│  │ +10 XP         │  │
│  │ +1 Session     │  │
│  │ Update stats   │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Save Session        │
│                      │
│  addPomodoroSession({│
│    taskId,           │
│    duration: 25,     │
│    completed: true   │
│  })                  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Suggest Break       │
│                      │
│  5-minute break      │
│  or continue?        │
└──────────────────────┘
```

---

### 9. **Authentication Flow**

```
┌──────────────┐
│   User       │
│  Sign Up/    │
│  Login       │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Supabase Auth       │
│                      │
│  Email + Password    │
│  or OAuth            │
└──────┬───────────────┘
       │
       ├─── ❌ Invalid ──► Show Error
       │
       ▼ ✅ Valid
┌──────────────────────┐
│  Create Session      │
│                      │
│  JWT Token           │
│  User Object         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Initialize User     │
│  Data                │
│                      │
│  Check if new user   │
└──────┬───────────────┘
       │
       ├─── New User ──► Create default data
       │
       ▼ Existing User
┌──────────────────────┐
│  Load User Data      │
│                      │
│  fetchAllUserData()  │
│                      │
│  ┌────────────────┐  │
│  │ Tasks          │  │
│  │ Flashcards     │  │
│  │ Sessions       │  │
│  │ Settings       │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Update Context      │
│                      │
│  dispatch({          │
│    type: 'LOAD_DATA',│
│    payload: userData │
│  })                  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Redirect to         │
│  Dashboard           │
│                      │
│  ✅ Logged in        │
└──────────────────────┘
```

---

### 10. **Component Hierarchy**

```
App.tsx
│
├── LandingPage
│   ├── Header
│   ├── HeroSection
│   ├── FeaturesSection
│   ├── FeatureCarousel
│   ├── FaqSection
│   ├── CtaSection
│   └── Footer
│
├── Login / Signup
│   └── ForgotPasswordModal
│
└── Dashboard (Protected)
    │
    ├── DashboardSidebar
    │   ├── Navigation Links
    │   └── User Profile
    │
    ├── TaskManager
    │   ├── TaskModal
    │   │   ├── Basic Info Tab
    │   │   ├── Files Tab
    │   │   │   └── FileUpload
    │   │   └── Notes Tab
    │   │
    │   └── TaskDetailModal
    │       ├── Details Tab
    │       ├── Files Tab
    │       └── Notes Tab
    │
    ├── FlashcardManager
    │   ├── FlashcardGenerator
    │   └── FlashcardGeneratorAI
    │
    ├── PomodoroTimer
    │   └── Timer Controls
    │
    ├── ScheduleView
    │   ├── Calendar
    │   └── ScheduleEventModal
    │
    ├── MaterialsManager
    │   ├── Material List
    │   └── Material Upload
    │
    ├── ProgressTracker
    │   ├── Stats Cards
    │   └── Charts
    │
    ├── FocusMode
    │   ├── Timer
    │   ├── Task Info
    │   └── Session Notes
    │
    ├── AIAssistant
    │   ├── ChatArea
    │   ├── ChatInput
    │   ├── FlashcardViewer
    │   ├── QuizViewer
    │   └── StudyPlanner
    │
    └── Settings
        ├── Profile
        ├── Appearance
        ├── Study Preferences
        └── Notifications
```

---

### 11. **Database Schema (Supabase)**

```
┌─────────────────────────────────────────────────────────┐
│                      USERS TABLE                        │
│  (Managed by Supabase Auth)                            │
│                                                         │
│  id (uuid, PK)                                         │
│  email (text)                                          │
│  created_at (timestamp)                                │
└─────────────────────────────────────────────────────────┘
                          │
                          │ One-to-Many
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      TASKS TABLE                        │
│                                                         │
│  id (uuid, PK)                                         │
│  user_id (uuid, FK) ──► users.id                       │
│  title (text)                                          │
│  description (text)                                    │
│  completed (boolean)                                   │
│  priority (text)                                       │
│  difficulty (text)                                     │
│  subject (text)                                        │
│  due_date (date)                                       │
│  due_time (time)                                       │
│  estimate (text)                                       │
│  status (text)                                         │
│  progress (integer)                                    │
│  created_at (timestamp)                                │
│  updated_at (timestamp)                                │
└─────────────────────────────────────────────────────────┘
                          │
                          │ One-to-Many
                          ├──────────────┬──────────────┐
                          ▼              ▼              ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│  TASK_FILES      │  │  TASK_NOTES  │  │  FLASHCARDS  │
│                  │  │              │  │              │
│  id (uuid, PK)   │  │  id (uuid)   │  │  id (uuid)   │
│  task_id (FK)    │  │  task_id(FK) │  │  task_id(FK) │
│  user_id (FK)    │  │  user_id(FK) │  │  user_id(FK) │
│  file_name       │  │  title       │  │  question    │
│  file_data       │  │  content     │  │  answer      │
│  file_size       │  │  created_at  │  │  difficulty  │
│  created_at      │  │              │  │  created_at  │
└──────────────────┘  └──────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────┐
│                  SCHEDULE_EVENTS TABLE                  │
│                                                         │
│  id (uuid, PK)                                         │
│  user_id (uuid, FK)                                    │
│  task_id (uuid, FK, nullable)                          │
│  title (text)                                          │
│  start_time (timestamp)                                │
│  end_time (timestamp)                                  │
│  type (text)                                           │
│  status (text)                                         │
│  created_at (timestamp)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   MATERIALS TABLE                       │
│                                                         │
│  id (uuid, PK)                                         │
│  user_id (uuid, FK)                                    │
│  title (text)                                          │
│  type (text)                                           │
│  content (text)                                        │
│  file_path (text)                                      │
│  created_at (timestamp)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   USER_STATS TABLE                      │
│                                                         │
│  id (uuid, PK)                                         │
│  user_id (uuid, FK, unique)                            │
│  total_tasks (integer)                                 │
│  completed_tasks (integer)                             │
│  total_study_time (integer)                            │
│  current_streak (integer)                              │
│  level (integer)                                       │
│  xp (integer)                                          │
│  updated_at (timestamp)                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Insights

### **Data Flow Principles**
1. **Unidirectional**: Data flows from Context → Components
2. **Immutable**: State updates create new objects
3. **Predictable**: Actions → Reducer → New State
4. **Optimistic**: UI updates before server confirmation
5. **Resilient**: Local backup + cloud sync

### **Performance Strategies**
1. **Lazy Loading**: Components loaded on demand
2. **Memoization**: Prevent unnecessary re-renders
3. **Debouncing**: Reduce API calls
4. **Caching**: Store frequently accessed data
5. **Virtualization**: Render only visible items

### **Security Layers**
1. **Authentication**: JWT tokens
2. **Authorization**: Row Level Security (RLS)
3. **Validation**: Frontend + Backend
4. **Encryption**: HTTPS + encrypted storage
5. **Sanitization**: XSS prevention

---

**Last Updated**: November 2, 2025
