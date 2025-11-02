# Enhanced Aesthetic Pomodoro Timer - Implementation Guide

## 🎯 Overview

This guide documents the implementation of an enhanced Pomodoro timer with:
- ✅ Customizable timer presets (1-999 minutes)
- ✅ Task selection and progress tracking
- ✅ Music playlist with Supabase Storage
- ✅ Floating music player UI
- ✅ Session analytics and history

## 📋 Features Implemented

### 1. Customizable Timer Sessions

**Preset Intervals:**
- Classic: 25min work / 5min break / 15min long break
- Extended Focus: 50min work / 10min break / 30min long break
- Quick Sprint: 15min work / 3min break / 10min long break
- Deep Work: 90min work / 15min break / 30min long break

**Custom Input:**
- Users can create unlimited custom presets
- Any duration from 1 to 999 minutes
- Save presets with custom names
- Stored in `user_settings.pomodoro_presets` (JSONB)

**Implementation:**
```typescript
interface PomodoroPreset {
  name: string;
  work: number; // minutes
  shortBreak: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
}

// Save custom preset
const savePreset = async (preset: PomodoroPreset) => {
  const { data, error } = await supabase
    .rpc('save_pomodoro_preset', {
      p_user_id: user.id,
      p_preset_name: preset.name,
      p_work_duration: preset.work,
      p_short_break: preset.shortBreak,
      p_long_break: preset.longBreak,
      p_sessions_until_long_break: preset.sessionsUntilLongBreak
    });
};
```

### 2. Task Selection & Management

**Features:**
- Select active task before starting Pomodoro
- View all pending tasks in dropdown
- Track which task each Pomodoro was for
- Auto-update task progress (10% per Pomodoro)
- Mark tasks complete when progress reaches 100%

**UI Components:**
```tsx
<Select value={selectedTask?.id} onValueChange={handleTaskSelect}>
  <SelectTrigger>
    <SelectValue placeholder="Select a task to focus on" />
  </SelectTrigger>
  <SelectContent>
    {pendingTasks.map(task => (
      <SelectItem key={task.id} value={task.id}>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
          <span>{task.title}</span>
          <span className="text-xs text-muted-foreground">
            {task.progress}%
          </span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Progress Tracking:**
```typescript
// After each completed Pomodoro
const updateTaskProgress = (task: Task) => {
  const progressIncrease = 10; // 10% per Pomodoro
  const newProgress = Math.min(100, task.progress + progressIncrease);
  const newStatus = newProgress >= 100 ? 'completed' : 'in_progress';
  
  updateTask({
    ...task,
    progress: newProgress,
    status: newStatus,
    completed: newProgress >= 100,
  });
};
```

### 3. Music Playlist (Supabase Storage)

**Database Schema:**
```sql
-- Playlists table
CREATE TABLE music_playlists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE
);

-- Tracks table
CREATE TABLE music_tracks (
  id UUID PRIMARY KEY,
  playlist_id UUID REFERENCES music_playlists(id),
  title TEXT NOT NULL,
  artist TEXT,
  duration INTEGER, -- seconds
  file_path TEXT NOT NULL, -- Supabase Storage path
  order_index INTEGER DEFAULT 0
);
```

**Supabase Storage Setup:**
```bash
# Create storage bucket
supabase storage create music --public

# Upload music files
supabase storage upload music/track1.mp3 ./music/track1.mp3
supabase storage upload music/track2.mp3 ./music/track2.mp3
# ... upload 15-20 tracks
```

**Fetching Playlist:**
```typescript
const loadPlaylist = async (playlistId: string) => {
  const { data, error } = await supabase
    .rpc('get_playlist_with_tracks', {
      p_playlist_id: playlistId
    });
  
  if (data) {
    const { playlist, tracks } = data;
    setPlaylist(playlist);
    setTracks(tracks);
  }
};

// Get signed URL for streaming
const getTrackUrl = async (filePath: string) => {
  const { data } = await supabase.storage
    .from('music')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  return data?.signedUrl;
};
```

**Audio Player Integration:**
```typescript
const audioRef = useRef<HTMLAudioElement>(null);

const playTrack = async (track: MusicTrack) => {
  const url = await getTrackUrl(track.file_path);
  if (audioRef.current && url) {
    audioRef.current.src = url;
    audioRef.current.volume = volume;
    await audioRef.current.play();
    setIsPlaying(true);
  }
};

const handleTrackEnd = () => {
  // Auto-play next track
  const nextIndex = (currentTrackIndex + 1) % tracks.length;
  setCurrentTrackIndex(nextIndex);
  playTrack(tracks[nextIndex]);
};
```

### 4. Floating Music Player UI

**CSS Styling:**
```css
.floating-music-player {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  padding: 16px;
}

.dark .floating-music-player {
  background: rgba(0, 0, 0, 0.95);
  box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
}
```

**Component Structure:**
```tsx
<motion.div
  className="floating-music-player"
  initial={{ opacity: 0, y: 100 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 100 }}
  drag
  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
>
  {/* Track Info */}
  <div className="flex items-center gap-3 mb-3">
    <Music className="h-10 w-10 text-purple-500" />
    <div className="flex-1 min-w-0">
      <p className="font-medium truncate">{currentTrack?.title}</p>
      <p className="text-xs text-muted-foreground truncate">
        {currentTrack?.artist}
      </p>
    </div>
  </div>
  
  {/* Progress Bar */}
  <div className="mb-3">
    <Progress value={playbackProgress} className="h-1" />
    <div className="flex justify-between text-xs text-muted-foreground mt-1">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
  </div>
  
  {/* Controls */}
  <div className="flex items-center justify-between">
    <Button
      variant="ghost"
      size="sm"
      onClick={handlePrevious}
      className="h-8 w-8 p-0"
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    
    <Button
      variant="default"
      size="sm"
      onClick={handlePlayPause}
      className="h-10 w-10 rounded-full"
    >
      {isPlaying ? (
        <Pause className="h-5 w-5" />
      ) : (
        <Play className="h-5 w-5" />
      )}
    </Button>
    
    <Button
      variant="ghost"
      size="sm"
      onClick={handleNext}
      className="h-8 w-8 p-0"
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
    
    {/* Volume Control */}
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMuteToggle}
        className="h-8 w-8 p-0"
      >
        {volume === 0 ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-16"
      />
    </div>
  </div>
  
  {/* Hidden Audio Element */}
  <audio
    ref={audioRef}
    onEnded={handleTrackEnd}
    onTimeUpdate={handleTimeUpdate}
  />
</motion.div>
```

### 5. Enhanced Timer UI

**Main Timer Display:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-6">
    {/* Preset Selector */}
    <div className="flex items-center justify-between mb-4">
      <Select value={activePreset.name} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map(preset => (
            <SelectItem key={preset.name} value={preset.name}>
              {preset.name} ({preset.work}m)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Custom
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Preset</DialogTitle>
          </DialogHeader>
          <CustomPresetForm onSave={handleSavePreset} />
        </DialogContent>
      </Dialog>
    </div>
    
    {/* Task Selector */}
    <div className="mb-4">
      <Label>Focus Task</Label>
      <TaskSelector
        selectedTask={selectedTask}
        onSelect={setSelectedTask}
      />
    </div>
    
    {/* Mode Badge */}
    <Badge className={`bg-gradient-to-r ${getModeColor()} text-white px-4 py-2 mb-4`}>
      <span className="flex items-center gap-2">
        {getModeIcon()}
        {getModeLabel()}
      </span>
    </Badge>
    
    {/* Timer Display */}
    <motion.div
      key={mode}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center mb-4"
    >
      <div className={`text-7xl font-bold font-mono bg-gradient-to-r ${getModeColor()} bg-clip-text text-transparent`}>
        {formatTime(timeLeft)}
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {mode === 'work' ? 'Stay focused!' : 'Take a break!'}
      </p>
    </motion.div>
    
    {/* Progress Bar */}
    <Progress value={getProgress()} className="h-2 mb-4" />
    
    {/* Controls */}
    <div className="flex items-center justify-center gap-2 mb-4">
      {!isRunning ? (
        <Button
          onClick={handleStart}
          size="lg"
          className={`bg-gradient-to-r ${getModeColor()} text-white`}
        >
          <Play className="h-5 w-5 mr-2" />
          Start
        </Button>
      ) : (
        <Button onClick={handlePause} size="lg" variant="outline">
          <Pause className="h-5 w-5 mr-2" />
          Pause
        </Button>
      )}
      
      <Button
        onClick={handleStop}
        size="lg"
        variant="outline"
        disabled={completedPomodoros === 0 && !isRunning}
      >
        <Square className="h-5 w-5 mr-2" />
        Stop
      </Button>
      
      <Button
        onClick={handleSkip}
        size="lg"
        variant="ghost"
        disabled={!isRunning}
      >
        <SkipForward className="h-5 w-5 mr-2" />
        Skip
      </Button>
      
      {/* Music Toggle */}
      <Button
        onClick={() => setMusicEnabled(!musicEnabled)}
        size="lg"
        variant="ghost"
        className={musicEnabled ? 'text-purple-500' : ''}
      >
        <Music className="h-5 w-5" />
      </Button>
    </div>
    
    {/* Stats */}
    {completedPomodoros > 0 && (
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold">{completedPomodoros}</p>
          <p className="text-xs text-muted-foreground">Pomodoros</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{totalWorkTime}</p>
          <p className="text-xs text-muted-foreground">Minutes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {selectedTask ? `${selectedTask.progress}%` : '-'}
          </p>
          <p className="text-xs text-muted-foreground">Progress</p>
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

### 6. Custom Preset Form

```tsx
function CustomPresetForm({ onSave }: { onSave: (preset: PomodoroPreset) => void }) {
  const [name, setName] = useState('');
  const [work, setWork] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [sessions, setSessions] = useState(4);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: 'Please enter a preset name', variant: 'destructive' });
      return;
    }
    
    if (work < 1 || work > 999) {
      toast({ title: 'Work duration must be between 1-999 minutes', variant: 'destructive' });
      return;
    }
    
    onSave({
      name: name.trim(),
      work,
      shortBreak,
      longBreak,
      sessionsUntilLongBreak: sessions,
    });
    
    toast({ title: '✅ Preset saved!', description: `"${name}" is now available` });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="preset-name">Preset Name</Label>
        <Input
          id="preset-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Custom Preset"
          maxLength={50}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="work-duration">Work (minutes)</Label>
          <Input
            id="work-duration"
            type="number"
            min="1"
            max="999"
            value={work}
            onChange={(e) => setWork(parseInt(e.target.value) || 25)}
          />
        </div>
        
        <div>
          <Label htmlFor="short-break">Short Break (minutes)</Label>
          <Input
            id="short-break"
            type="number"
            min="1"
            max="999"
            value={shortBreak}
            onChange={(e) => setShortBreak(parseInt(e.target.value) || 5)}
          />
        </div>
        
        <div>
          <Label htmlFor="long-break">Long Break (minutes)</Label>
          <Input
            id="long-break"
            type="number"
            min="1"
            max="999"
            value={longBreak}
            onChange={(e) => setLongBreak(parseInt(e.target.value) || 15)}
          />
        </div>
        
        <div>
          <Label htmlFor="sessions">Sessions Until Long Break</Label>
          <Input
            id="sessions"
            type="number"
            min="1"
            max="10"
            value={sessions}
            onChange={(e) => setSessions(parseInt(e.target.value) || 4)}
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Save Preset
      </Button>
    </form>
  );
}
```

## 📊 Session Analytics

**Track Pomodoro Statistics:**
```typescript
const getStats = async (days: number = 7) => {
  const { data, error } = await supabase
    .rpc('get_pomodoro_stats', {
      p_user_id: user.id,
      p_days: days
    });
  
  if (data) {
    return {
      totalSessions: data.total_sessions,
      completedSessions: data.completed_sessions,
      totalMinutes: data.total_minutes,
      averageSessionLength: data.average_session_length,
      mostProductiveHour: data.most_productive_hour,
      tasksWorkedOn: data.tasks_worked_on,
      interruptions: data.interruptions,
      sessionsByDay: data.sessions_by_day,
    };
  }
};
```

**Display Analytics:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Your Pomodoro Stats (Last 7 Days)</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-4 border rounded-lg">
        <p className="text-3xl font-bold">{stats.completedSessions}</p>
        <p className="text-sm text-muted-foreground">Completed</p>
      </div>
      
      <div className="text-center p-4 border rounded-lg">
        <p className="text-3xl font-bold">{stats.totalMinutes}</p>
        <p className="text-sm text-muted-foreground">Minutes</p>
      </div>
      
      <div className="text-center p-4 border rounded-lg">
        <p className="text-3xl font-bold">{stats.tasksWorkedOn}</p>
        <p className="text-sm text-muted-foreground">Tasks</p>
      </div>
      
      <div className="text-center p-4 border rounded-lg">
        <p className="text-3xl font-bold">{stats.mostProductiveHour}:00</p>
        <p className="text-sm text-muted-foreground">Peak Hour</p>
      </div>
    </div>
  </CardContent>
</Card>
```

## 🎵 Music Setup Guide

### Step 1: Create Storage Bucket
```bash
# In Supabase Dashboard or CLI
supabase storage create music --public
```

### Step 2: Upload Music Files
```bash
# Upload ambient/study music tracks
# Recommended: 15-20 tracks, ~7-8 hours total
# Format: MP3, 128-320 kbps

supabase storage upload music/ambient-1.mp3 ./music/ambient-1.mp3
supabase storage upload music/lofi-study-1.mp3 ./music/lofi-study-1.mp3
# ... continue for all tracks
```

### Step 3: Insert Track Records
```sql
-- Get the default playlist ID
SELECT id FROM music_playlists WHERE is_default = TRUE;

-- Insert tracks
INSERT INTO music_tracks (playlist_id, title, artist, duration, file_path, order_index)
VALUES
  ('playlist-id', 'Ambient Study 1', 'Study Music', 300, 'ambient-1.mp3', 1),
  ('playlist-id', 'Lo-Fi Beats', 'Chill Hop', 240, 'lofi-study-1.mp3', 2),
  -- ... add all tracks
;
```

### Step 4: Test Playback
```typescript
// Test fetching and playing
const testMusic = async () => {
  const { data } = await supabase
    .rpc('get_playlist_with_tracks', {
      p_playlist_id: 'default-playlist-id'
    });
  
  console.log('Playlist:', data.playlist);
  console.log('Tracks:', data.tracks);
  
  // Get signed URL for first track
  const { data: urlData } = await supabase.storage
    .from('music')
    .createSignedUrl(data.tracks[0].file_path, 3600);
  
  console.log('Stream URL:', urlData.signedUrl);
};
```

## 🚀 Deployment Checklist

### Database
- [ ] Run `ENHANCED_POMODORO_FEATURES.sql` migration
- [ ] Verify `music_playlists` table created
- [ ] Verify `music_tracks` table created
- [ ] Verify `user_settings` has new columns
- [ ] Test `save_pomodoro_preset()` function
- [ ] Test `get_pomodoro_stats()` function
- [ ] Test `get_playlist_with_tracks()` function

### Storage
- [ ] Create `music` storage bucket
- [ ] Upload 15-20 music tracks
- [ ] Insert track records in database
- [ ] Test signed URL generation
- [ ] Verify streaming works

### Frontend
- [ ] Implement `EnhancedPomodoroTimer` component
- [ ] Implement `FloatingMusicPlayer` component
- [ ] Implement `CustomPresetForm` component
- [ ] Implement `TaskSelector` component
- [ ] Add music player controls
- [ ] Test all timer modes
- [ ] Test preset saving/loading
- [ ] Test task selection
- [ ] Test music playback
- [ ] Test floating player drag

### Testing
- [ ] Create custom preset (1-999 minutes)
- [ ] Save and load preset
- [ ] Select task before Pomodoro
- [ ] Complete Pomodoro and verify progress
- [ ] Play music during session
- [ ] Control volume and skip tracks
- [ ] Drag floating player
- [ ] View session statistics
- [ ] Test on mobile devices

## 📱 Mobile Optimization

```css
/* Responsive floating player */
@media (max-width: 640px) {
  .floating-music-player {
    width: calc(100% - 40px);
    left: 20px;
    right: 20px;
    bottom: 80px; /* Above mobile nav */
  }
}

/* Touch-friendly controls */
.music-control-button {
  min-width: 44px;
  min-height: 44px;
}
```

## 🎨 Theme Consistency

All components maintain the existing aesthetic theme:
- Gradient backgrounds for mode indicators
- Smooth animations with Framer Motion
- Glassmorphism for floating player
- Consistent color palette
- Rounded corners and shadows
- Dark mode support

## 📚 Resources

- **Pomodoro Technique**: https://todoist.com/productivity-methods/pomodoro-technique
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
- **Framer Motion**: https://www.framer.com/motion/

---

**Status**: Ready for Implementation ✅  
**Version**: 2.0.0  
**Last Updated**: November 2, 2025
