# 📚 Study Planner & Task Manager - Complete Architecture Guide

## 🎯 Overview

This is a comprehensive **React + TypeScript + Supabase** study planner web application designed to help students organize their learning, manage tasks, track progress, and enhance productivity through AI-powered features.

---

## 🏗️ System Architecture

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: React Context API + useReducer
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Animations**: Framer Motion
- **AI Integration**: Custom AI service (OpenAI/Gemini)
- **Storage**: IndexedDB (local) + Supabase (cloud sync)

---

## 📁 Project Structure

```
src/
├── components/
│   ├── features/          # Main feature components
│   │   ├── TaskManager.tsx          # Task management UI
│   │   ├── FlashcardManager.tsx     # Flashcard system
│   │   ├── PomodoroTimer.tsx        # Focus timer
│   │   ├── ScheduleView.tsx         # Calendar/schedule
│   │   ├── MaterialsManager.tsx     # Study materials
│   │   ├── ProgressTracker.tsx      # Stats & analytics
│   │   ├── FocusMode.tsx            # Distraction-free mode
│   │   └── Settings.tsx             # User preferences
│   │
│   ├── modals/            # Modal dialogs
│   │   ├── TaskModal.tsx            # Create/edit tasks
│   │   ├── TaskDetailModal.tsx      # View task details
│   │   └── ScheduleEventModal.tsx   # Schedule events
│   │
│   ├── ai-assistant/      # AI features
│   │   ├── AIAssistant.tsx          # Main AI chat
│   │   ├── FlashcardViewer.tsx      # AI-generated flashcards
│   │   ├── QuizViewer.tsx           # AI-generated quizzes
│   │   └── StudyPlanner.tsx         # AI study planning
│   │
│   └── ui/                # Reusable UI components (shadcn)
│
├── contexts/              # Global state management
│   ├── StudyPlannerContext.tsx      # Main app state
│   ├── AuthContext.tsx              # Authentication
│   └── ChatHistoryContext.tsx       # AI chat history
│
├── services/              # Business logic & API calls
│   ├── taskFilesService.ts          # File uploads
│   ├── dataSyncService.ts           # Supabase sync
│   ├── aiService.ts                 # AI integration
│   ├── storageService.ts            # File storage
│   └── authService.ts               # Authentication
│
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   ├── useStudyEvents.ts
│   └── useSessionNotes.ts
│
├── utils/                 # Utility functions
│   ├── indexedDBStorage.ts          # Local storage
│   ├── notificationService.ts       # Browser notifications
│   └── storageManager.ts            # Storage abstraction
│
└── pages/                 # Route pages
    ├── Dashboard.tsx                # Main dashboard
    ├── LandingPage.tsx              # Marketing page
    └── Login.tsx / Signup.tsx       # Auth pages
```

---

## 🎨 Core Features & Components

### 1. **Task Management System** 📝

#### **Data Model (Task Interface)**
```typescript
interface Task {
  id: string                    // UUID
  title: string                 // Task name
  description?: string          // Detailed description
  completed: boolean            // Completion status
  priority: 'low' | 'medium' | 'high' | 'urgent'
  difficulty?: 'easy' | 'medium' | 'hard'
  subject?: string              // Academic subject
  dueDate?: string              // ISO date string
  dueTime?: string              // HH:MM format
  estimate?: string             // Time estimate (e.g., "2h")
  reminder?: string             // Reminder time
  progress: number              // 0-100 percentage
  status?: 'pending' | 'in_progress' | 'completed' | 'missed'
  createdAt: string             // ISO timestamp
  updatedAt: string             // ISO timestamp
  pomodoroSessions: number      // Count of pomodoro sessions
  flashcardsGenerated: boolean  // AI flashcard flag
  materialIds?: string[]        // Linked materials
  notes?: string                // Task notes
}
```

#### **Key Features**
- ✅ **CRUD Operations**: Create, Read, Update, Delete tasks
- 🔍 **Search & Filter**: By status, priority, subject, keywords
- 📅 **Due Date/Time Validation**: Prevents past dates (NEW!)
- 🏷️ **Priority Levels**: Urgent, High, Medium, Low with color coding
- 📊 **Progress Tracking**: Visual progress bars
- 📎 **File Attachments**: Upload PDFs, images, documents
- 📝 **Notes**: Add detailed notes to tasks
- 🔗 **Material Linking**: Connect study materials to tasks
- ⏱️ **Pomodoro Integration**: Start focus sessions from tasks
- ✨ **AI Flashcard Generation**: Auto-generate study cards

#### **TaskManager Component Flow**
```
User Action → TaskManager.tsx
    ↓
Context API (StudyPlannerContext)
    ↓
Reducer (studyPlannerReducer)
    ↓
State Update + Supabase Sync (dataSyncService)
    ↓
UI Re-render with new data
```

---

### 2. **Task Detail View** 🔍

#### **TaskDetailModal Features**
- **Tabbed Interface**:
  - **Details Tab**: View/edit task information
  - **Files Tab**: Manage uploaded files
  - **Notes Tab**: View/add task notes

- **File Management**:
  - View files inline (PDFs, images)
  - Download files
  - Delete attachments
  - File size display
  - Upload date tracking

- **Action Buttons**:
  - Edit task details
  - Mark complete/reopen
  - Delete task
  - Save changes (with validation)

- **Visual Enhancements**:
  - Priority badges with colors
  - Status indicators
  - Overdue warnings
  - Material count display
  - Animated transitions (Framer Motion)

---

### 3. **Date/Time Validation System** ⏰

#### **Validation Rules**
1. **Date Validation**:
   - Cannot select past dates
   - Min date set to today
   - Real-time error messages
   - Visual red border on invalid input

2. **Time Validation**:
   - Only validates if date is today
   - Must be later than current time
   - Disabled until date is selected
   - Smart validation for future dates

3. **Submit Validation**:
   - Pre-submission checks
   - Combined datetime validation
   - Toast notifications for errors
   - Button disabled on validation errors

#### **Implementation**
```typescript
// Date validation
const validateDueDate = (date: string): boolean => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    setDateError('Due date cannot be in the past');
    return false;
  }
  return true;
};

// Time validation (only for today)
const validateDueTime = (time: string, date: string): boolean => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate.getTime() === today.getTime()) {
    const [hours, minutes] = time.split(':').map(Number);
    const selectedDateTime = new Date();
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    if (selectedDateTime <= new Date()) {
      setTimeError('Due time must be later than current time');
      return false;
    }
  }
  return true;
};
```

---

### 4. **File Upload & Storage System** 📁

#### **Architecture**
```
User Upload → TaskModal/TaskManager
    ↓
File Processing (Base64 encoding)
    ↓
Supabase Storage (task_files table)
    ↓
File Metadata stored in database
    ↓
Display in TaskDetailModal
```

#### **Supported File Types**
- 📄 PDFs
- 🖼️ Images (PNG, JPG, JPEG)
- 📝 Documents (DOC, DOCX, TXT)
- 📊 Spreadsheets (XLS, XLSX)
- 📊 Presentations (PPT, PPTX)
- 📦 Archives (ZIP, RAR)

#### **File Operations**
```typescript
// Upload file
uploadTaskFile(userId, taskId, file) → TaskFile

// Get files for task
getTaskFiles(taskId) → TaskFile[]

// View file
getTaskFileData(fileId) → base64 string

// Download file
downloadFile(base64Data, fileName)

// Delete file
deleteTaskFile(fileId) → boolean
```

---

### 5. **State Management (StudyPlannerContext)** 🔄

#### **Global State Structure**
```typescript
interface StudyPlannerState {
  tasks: Task[]                      // All tasks
  flashcards: Flashcard[]            // Flashcard collection
  flashcardDecks: FlashcardDeck[]    // Organized decks
  pomodoroSessions: PomodoroSession[] // Focus sessions
  scheduleEvents: ScheduleEvent[]    // Calendar events
  materials: Material[]              // Study materials
  sessionNotes: SessionNote[]        // Session notes
  reminders: Reminder[]              // Notifications
  userStats: UserStats               // Progress metrics
  settings: AppSettings              // User preferences
  currentPomodoroTask?: Task         // Active focus task
  isLoading: boolean                 // Loading state
  focusMode: {                       // Focus mode state
    isOpen: boolean
    studyEventId?: string
    taskId?: string
  }
}
```

#### **Available Actions**
```typescript
// Task Actions
ADD_TASK, UPDATE_TASK, DELETE_TASK, TOGGLE_TASK

// Flashcard Actions
ADD_FLASHCARD, UPDATE_FLASHCARD, DELETE_FLASHCARD
ADD_FLASHCARD_DECK, UPDATE_FLASHCARD_DECK, DELETE_FLASHCARD_DECK

// Pomodoro Actions
ADD_POMODORO_SESSION, UPDATE_POMODORO_SESSION
SET_CURRENT_POMODORO_TASK

// Schedule Actions
ADD_SCHEDULE_EVENT, UPDATE_SCHEDULE_EVENT, DELETE_SCHEDULE_EVENT

// Material Actions
ADD_MATERIAL, UPDATE_MATERIAL, DELETE_MATERIAL
ATTACH_MATERIAL_TO_TASK, DETACH_MATERIAL_FROM_TASK

// Settings Actions
UPDATE_USER_STATS, UPDATE_SETTINGS

// Focus Mode Actions
OPEN_FOCUS_MODE, CLOSE_FOCUS_MODE

// Data Actions
LOAD_DATA, SET_LOADING
```

---

### 6. **Data Synchronization** 🔄

#### **Sync Strategy**
1. **Local-First Approach**:
   - Changes saved to IndexedDB immediately
   - UI updates instantly
   - Background sync to Supabase

2. **Conflict Resolution**:
   - Last-write-wins strategy
   - Timestamp-based merging
   - User notification on conflicts

3. **Offline Support**:
   - Full functionality offline
   - Queue sync operations
   - Auto-sync when online

#### **Sync Flow**
```
User Action
    ↓
Update Local State (Context)
    ↓
Save to IndexedDB (backup)
    ↓
Sync to Supabase (if online)
    ↓
Update UI with confirmation
```

---

### 7. **AI Integration** 🤖

#### **AI Features**
1. **File Analysis**:
   - Upload PDFs, documents, images
   - AI extracts key concepts
   - Generates study suggestions

2. **Flashcard Generation**:
   - Auto-create flashcards from content
   - Question-answer pairs
   - Difficulty levels

3. **Study Planning**:
   - Analyze workload
   - Suggest optimal schedule
   - Break down complex tasks

4. **Quiz Generation**:
   - Multiple choice questions
   - True/false questions
   - Short answer prompts

#### **AI Upload Flow**
```
User uploads file → TaskManager
    ↓
File stored in Supabase Storage
    ↓
AI Service analyzes content
    ↓
Generate suggestions:
  - Tasks
  - Flashcards
  - Schedule
  - Notes
    ↓
User reviews and accepts suggestions
    ↓
Items added to study planner
```

---

### 8. **Pomodoro Timer Integration** ⏱️

#### **Features**
- 25-minute work sessions
- 5-minute short breaks
- 15-minute long breaks
- Task-linked sessions
- Session history tracking
- XP rewards for completion

#### **Workflow**
```
Select Task → Start Pomodoro
    ↓
25-minute countdown
    ↓
Session Complete
    ↓
Update task progress
    ↓
Add XP to user stats
    ↓
Suggest break or next task
```

---

### 9. **Flashcard System** 🎴

#### **Flashcard Data Model**
```typescript
interface Flashcard {
  id: string
  taskId?: string              // Linked task
  question: string             // Front of card
  answer: string               // Back of card
  subject?: string             // Academic subject
  difficulty: 'easy' | 'medium' | 'hard'
  lastReviewed?: string        // Last study date
  nextReview?: string          // Spaced repetition
  reviewCount: number          // Total reviews
  correctCount: number         // Correct answers
  createdAt: string
}
```

#### **Study Modes**
- **Flip Cards**: Traditional flashcard review
- **Quiz Mode**: Test yourself
- **Spaced Repetition**: Optimized review schedule
- **Shuffle**: Random order

---

### 10. **Schedule & Calendar** 📅

#### **ScheduleEvent Model**
```typescript
interface ScheduleEvent {
  id: string
  title: string
  description?: string
  startTime: string            // ISO timestamp
  endTime: string              // ISO timestamp
  type: 'task' | 'study' | 'break' | 'other'
  taskId?: string              // Linked task
  color?: string               // Visual coding
  status?: 'scheduled' | 'in_progress' | 'completed' | 'missed'
  missedCount?: number         // Tracking
  startedAt?: string           // Actual start
  completedAt?: string         // Actual completion
}
```

#### **Auto-Advance Feature**
- Automatically marks missed events
- Starts next scheduled event
- Opens Focus Mode automatically
- Sends notifications
- Updates task status

---

### 11. **Materials Manager** 📚

#### **Material Types**
- 📝 Notes
- 📄 PDFs
- 🖼️ Images
- 📄 Documents
- 📊 Presentations
- 🔗 Links
- 📦 Other

#### **Material Operations**
- Upload files
- Link to tasks
- Tag and categorize
- Search and filter
- View inline
- Download
- Delete

---

### 12. **Progress Tracking** 📊

#### **User Stats**
```typescript
interface UserStats {
  totalTasks: number           // All-time tasks
  completedTasks: number       // Finished tasks
  totalStudyTime: number       // Minutes studied
  currentStreak: number        // Consecutive days
  level: number                // Gamification level
  xp: number                   // Experience points
  xpToNextLevel: number        // Progress to next level
}
```

#### **XP System**
- Complete task: +20 XP
- Pomodoro session: +10 XP
- Flashcard review: +5 XP
- Daily streak: +50 XP
- Level up every 100 XP

---

### 13. **Settings & Preferences** ⚙️

#### **Configuration Options**
```typescript
interface AppSettings {
  profile: {
    displayName: string
    email: string
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
    language: string
  }
  studyPreferences: {
    dailyGoal: number          // Hours per day
    pomodoroLength: number     // Minutes
    breakLength: number        // Minutes
    autoStartBreaks: boolean
    autoAdvanceEnabled: boolean
  }
  notifications: {
    studyReminders: boolean
    taskDeadlines: boolean
    achievements: boolean
    weeklyReport: boolean
    notificationsEnabled: boolean
    notificationSound: boolean
  }
}
```

---

## 🔐 Authentication & Security

### **Auth Flow**
```
User Sign Up/Login
    ↓
Supabase Auth (JWT tokens)
    ↓
User session created
    ↓
Load user data from Supabase
    ↓
Initialize local state
    ↓
Enable real-time sync
```

### **Security Features**
- Row Level Security (RLS) in Supabase
- User-specific data isolation
- Secure file storage
- JWT token authentication
- Password reset flow
- Email verification

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### **Mobile Optimizations**
- Touch-friendly buttons
- Swipe gestures
- Collapsible sidebars
- Bottom navigation
- Optimized modals

---

## 🚀 Performance Optimizations

### **Code Splitting**
- Lazy loading routes
- Dynamic imports for modals
- Chunked vendor bundles

### **State Optimization**
- Memoized selectors
- Debounced search
- Virtualized lists (for large datasets)
- Optimistic UI updates

### **Caching Strategy**
- IndexedDB for offline data
- Service Worker (PWA ready)
- Image optimization
- API response caching

---

## 🧪 Testing Strategy

### **Unit Tests**
- Context reducers
- Utility functions
- Validation logic

### **Integration Tests**
- Component interactions
- API calls
- State management

### **E2E Tests**
- User workflows
- Critical paths
- Cross-browser testing

---

## 📦 Deployment

### **Build Process**
```bash
npm run build
```

### **Environment Variables**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_AI_API_KEY=your_ai_key
```

### **Hosting**
- **Frontend**: Vercel / Netlify
- **Backend**: Supabase (managed)
- **Storage**: Supabase Storage
- **Database**: PostgreSQL (Supabase)

---

## 🔮 Future Enhancements

### **Planned Features**
- [ ] Mobile app (React Native)
- [ ] Collaborative study groups
- [ ] Video call integration
- [ ] Advanced analytics dashboard
- [ ] Export to PDF/CSV
- [ ] Integration with Google Calendar
- [ ] Voice commands
- [ ] Dark mode themes
- [ ] Multi-language support
- [ ] Gamification leaderboards

---

## 📚 Key Takeaways

### **Architecture Highlights**
1. **Modular Design**: Each feature is self-contained
2. **Type Safety**: Full TypeScript coverage
3. **Scalable State**: Context API with reducer pattern
4. **Offline-First**: Works without internet
5. **Real-time Sync**: Supabase integration
6. **AI-Powered**: Smart study assistance
7. **User-Centric**: Intuitive UX/UI
8. **Performance**: Optimized for speed
9. **Secure**: RLS and authentication
10. **Extensible**: Easy to add features

### **Best Practices**
- ✅ Component composition
- ✅ Custom hooks for logic reuse
- ✅ Error boundaries
- ✅ Loading states
- ✅ Optimistic updates
- ✅ Accessibility (ARIA labels)
- ✅ Responsive design
- ✅ Code documentation
- ✅ Git workflow
- ✅ CI/CD pipeline

---

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create feature branch
3. Make changes
4. Write tests
5. Submit pull request
6. Code review
7. Merge to main

---

## 📞 Support

For questions or issues:
- 📧 Email: support@studyplanner.com
- 💬 Discord: [Join our community]
- 📖 Docs: [Read the docs]
- 🐛 Issues: [GitHub Issues]

---

**Last Updated**: November 2, 2025
**Version**: 2.0.0
**Status**: ✅ Production Ready
