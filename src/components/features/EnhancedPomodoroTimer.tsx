import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Timer,
  Coffee,
  Zap,
  Settings,
  Plus,
  Save,
  ListTodo,
  Music,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface PomodoroPreset {
  name: string;
  work: number;
  shortBreak: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
}

interface EnhancedPomodoroTimerProps {
  taskId?: string;
  eventId?: string;
  onSessionComplete?: (pomodoroCount: number, totalMinutes: number) => void;
}

type TimerMode = 'work' | 'short-break' | 'long-break';

const DEFAULT_PRESETS: PomodoroPreset[] = [
  { name: 'Classic', work: 25, shortBreak: 5, longBreak: 15, sessionsUntilLongBreak: 4 },
  { name: 'Extended Focus', work: 50, shortBreak: 10, longBreak: 30, sessionsUntilLongBreak: 3 },
  { name: 'Quick Sprint', work: 15, shortBreak: 3, longBreak: 10, sessionsUntilLongBreak: 4 },
  { name: 'Deep Work', work: 90, shortBreak: 15, longBreak: 30, sessionsUntilLongBreak: 2 },
];

export function EnhancedPomodoroTimer({ taskId, eventId, onSessionComplete }: EnhancedPomodoroTimerProps) {
  const { state, updateTask, updateScheduleEvent } = useStudyPlanner();
  const { toast } = useToast();

  
  // Presets and settings
  const [presets, setPresets] = useState<PomodoroPreset[]>(DEFAULT_PRESETS);
  const [activePreset, setActivePreset] = useState<PomodoroPreset>(DEFAULT_PRESETS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  
  // Timer state
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(activePreset.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  
  // Task selection
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  
  // Music player
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio
  useEffect(() => {
    if (state.settings.notifications.notificationSound) {
      notificationAudioRef.current = new Audio('/notification.mp3');
    }
  }, [state.settings.notifications.notificationSound]);
  
  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pomodoroPresets');
    if (saved) {
      try {
        const savedPresets = JSON.parse(saved);
        setPresets([...DEFAULT_PRESETS, ...savedPresets]);
      } catch (e) {
        console.error('Failed to load presets:', e);
      }
    }
  }, []);
  
  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  
  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Play notification sound
    if (notificationAudioRef.current && state.settings.notifications.notificationSound) {
      notificationAudioRef.current.play().catch(console.error);
    }
    
    if (mode === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      setTotalWorkTime((prev) => prev + activePreset.work);
      
      // Update task progress
      if (selectedTask || taskId) {
        const task = selectedTask || state.tasks.find((t) => t.id === taskId);
        if (task) {
          const progressIncrease = 10;
          const newProgress = Math.min(100, task.progress + progressIncrease);
          updateTask({
            ...task,
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'in_progress',
            completed: newProgress >= 100,
          });
        }
      }
      
      // Update event
      if (eventId) {
        const event = state.scheduleEvents.find((e) => e.id === eventId);
        if (event) {
          updateScheduleEvent({
            ...event,
            status: 'in_progress',
          });
        }
      }
      
      toast({
        title: '🎉 Pomodoro Complete!',
        description: `Great work! You've completed ${newCount} pomodoro${newCount > 1 ? 's' : ''}.`,
      });
      
      // Auto-start break if enabled
      if (state.settings.studyPreferences.autoStartBreaks) {
        startBreak(newCount);
      }
    } else {
      toast({
        title: '✅ Break Complete!',
        description: 'Ready to get back to work?',
      });
      
      setMode('work');
      setTimeLeft(activePreset.work * 60);
    }
  };
  
  const startBreak = (pomodoroCount: number) => {
    const isLongBreak = pomodoroCount % activePreset.sessionsUntilLongBreak === 0;
    const breakMode: TimerMode = isLongBreak ? 'long-break' : 'short-break';
    const breakDuration = isLongBreak ? activePreset.longBreak : activePreset.shortBreak;
    
    setMode(breakMode);
    setTimeLeft(breakDuration * 60);
    
    if (state.settings.studyPreferences.autoStartBreaks) {
      setIsRunning(true);
    }
  };

  
  const handleStart = () => {
    setIsRunning(true);
    
    if (eventId) {
      const event = state.scheduleEvents.find((e) => e.id === eventId);
      if (event && event.status === 'scheduled') {
        updateScheduleEvent({
          ...event,
          status: 'in_progress',
          startedAt: new Date().toISOString(),
        });
      }
    }
    
    if (selectedTask && selectedTask.status === 'pending') {
      updateTask({
        ...selectedTask,
        status: 'in_progress',
      });
    }
  };
  
  const handlePause = () => {
    setIsRunning(false);
  };
  
  const handleStop = () => {
    setIsRunning(false);
    
    if (onSessionComplete && completedPomodoros > 0) {
      onSessionComplete(completedPomodoros, totalWorkTime);
    }
    
    setMode('work');
    setTimeLeft(activePreset.work * 60);
    setCompletedPomodoros(0);
    setTotalWorkTime(0);
  };
  
  const handleSkip = () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      startBreak(completedPomodoros);
    } else {
      setMode('work');
      setTimeLeft(activePreset.work * 60);
    }
  };
  
  const handlePresetChange = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      setActivePreset(preset);
      setMode('work');
      setTimeLeft(preset.work * 60);
      setIsRunning(false);
      
      localStorage.setItem('activePreset', presetName);
    }
  };
  
  const handleSavePreset = (preset: PomodoroPreset) => {
    const customPresets = presets.filter(p => !DEFAULT_PRESETS.find(dp => dp.name === p.name));
    const newCustomPresets = [...customPresets, preset];
    
    localStorage.setItem('pomodoroPresets', JSON.stringify(newCustomPresets));
    setPresets([...DEFAULT_PRESETS, ...newCustomPresets]);
    setActivePreset(preset);
    setMode('work');
    setTimeLeft(preset.work * 60);
    setShowSettings(false);
    
    toast({
      title: '✅ Preset Saved!',
      description: `"${preset.name}" is now available`,
    });
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getProgress = () => {
    const totalDuration = mode === 'work' 
      ? activePreset.work * 60 
      : mode === 'short-break' 
      ? activePreset.shortBreak * 60 
      : activePreset.longBreak * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };
  
  const getModeColor = () => {
    switch (mode) {
      case 'work':
        return 'from-red-500 to-orange-500';
      case 'short-break':
        return 'from-green-500 to-emerald-500';
      case 'long-break':
        return 'from-blue-500 to-purple-500';
    }
  };
  
  const getModeIcon = () => {
    switch (mode) {
      case 'work':
        return <Zap className="h-6 w-6" />;
      case 'short-break':
        return <Coffee className="h-6 w-6" />;
      case 'long-break':
        return <Coffee className="h-6 w-6" />;
    }
  };
  
  const getModeLabel = () => {
    switch (mode) {
      case 'work':
        return 'Focus Time';
      case 'short-break':
        return 'Short Break';
      case 'long-break':
        return 'Long Break';
    }
  };
  
  const pendingTasks = state.tasks.filter(t => !t.completed);
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Preset Selector */}
          <div className="flex items-center justify-between">
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
                  <Plus className="h-4 w-4 mr-2" />
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
          {pendingTasks.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Focus Task</Label>
              <Select 
                value={selectedTask?.id || ''} 
                onValueChange={(id) => {
                  const task = pendingTasks.find(t => t.id === id);
                  setSelectedTask(task || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task to focus on" />
                </SelectTrigger>
                <SelectContent>
                  {pendingTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${
                          task.priority === 'urgent' ? 'bg-red-500' :
                          task.priority === 'high' ? 'bg-orange-500' :
                          task.priority === 'medium' ? 'bg-blue-500' :
                          'bg-green-500'
                        } text-white`}>
                          {task.priority}
                        </Badge>
                        <span className="truncate">{task.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {task.progress}%
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Mode Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`bg-gradient-to-r ${getModeColor()} text-white px-4 py-2`}>
              <span className="flex items-center gap-2">
                {getModeIcon()}
                {getModeLabel()}
              </span>
            </Badge>
            
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {completedPomodoros} / {activePreset.sessionsUntilLongBreak}
              </span>
            </div>
          </div>
          
          {/* Timer Display */}
          <motion.div
            key={mode}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className={`text-7xl font-bold font-mono bg-gradient-to-r ${getModeColor()} bg-clip-text text-transparent`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === 'work' ? 'Stay focused!' : 'Take a break!'}
            </p>
          </motion.div>
          
          {/* Progress Bar */}
          <Progress value={getProgress()} className="h-2" />
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
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
              <Button
                onClick={handlePause}
                size="lg"
                variant="outline"
              >
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
          
          {/* Settings Info */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <p>
              Work: {activePreset.work}m • Short Break: {activePreset.shortBreak}m • Long Break: {activePreset.longBreak}m
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom Preset Form Component
function CustomPresetForm({ onSave }: { onSave: (preset: PomodoroPreset) => void }) {
  const [name, setName] = useState('');
  const [work, setWork] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [sessions, setSessions] = useState(4);
  const { toast } = useToast();
  
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
