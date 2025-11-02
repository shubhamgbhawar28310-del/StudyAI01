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
} from 'lucide-react';

interface PomodoroTimerProps {
  taskId?: string;
  eventId?: string;
  onSessionComplete?: (pomodoroCount: number, totalMinutes: number) => void;
  customWorkDuration?: number;
  customBreakDuration?: number;
  customLongBreakDuration?: number;
}

type TimerMode = 'work' | 'short-break' | 'long-break';

export function PomodoroTimer({ 
  taskId, 
  eventId, 
  onSessionComplete,
  customWorkDuration,
  customBreakDuration,
  customLongBreakDuration
}: PomodoroTimerProps) {
  const { state, updateTask, updateScheduleEvent } = useStudyPlanner();
  const { toast } = useToast();
  
  // Get settings
  const settings = state.settings.studyPreferences;
  const workDuration = customWorkDuration || settings.pomodoroLength || 25;
  const shortBreakDuration = customBreakDuration || settings.breakLength || 5;
  const longBreakDuration = customLongBreakDuration || 15;
  const sessionsUntilLongBreak = 4;
  
  // Timer state
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(workDuration * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0); // in minutes
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio for notifications
  useEffect(() => {
    if (state.settings.notifications.notificationSound) {
      audioRef.current = new Audio('/notification.mp3'); // Add notification sound to public folder
    }
  }, [state.settings.notifications.notificationSound]);
  
  // Reset timer when custom durations change
  useEffect(() => {
    // Stop current timer if running
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Reset to work mode with new duration
    setMode('work');
    setTimeLeft(workDuration * 60);
  }, [workDuration, shortBreakDuration, longBreakDuration]);
  
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
    if (audioRef.current && state.settings.notifications.notificationSound) {
      audioRef.current.play().catch(console.error);
    }
    
    if (mode === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      setTotalWorkTime((prev) => prev + workDuration);
      
      // Update task progress
      if (taskId) {
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          const progressIncrease = 10; // 10% per pomodoro
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
      if (settings.autoStartBreaks) {
        startBreak(newCount);
      } else {
        // Suggest break
        toast({
          title: '☕ Time for a break!',
          description: `Take a ${newCount % sessionsUntilLongBreak === 0 ? 'long' : 'short'} break.`,
        });
      }
    } else {
      // Break completed
      toast({
        title: '✅ Break Complete!',
        description: 'Ready to get back to work?',
      });
      
      // Reset to work mode
      setMode('work');
      setTimeLeft(workDuration * 60);
    }
  };
  
  const startBreak = (pomodoroCount: number) => {
    const isLongBreak = pomodoroCount % sessionsUntilLongBreak === 0;
    const breakMode: TimerMode = isLongBreak ? 'long-break' : 'short-break';
    const breakDuration = isLongBreak ? longBreakDuration : shortBreakDuration;
    
    setMode(breakMode);
    setTimeLeft(breakDuration * 60);
    
    if (settings.autoStartBreaks) {
      setIsRunning(true);
    }
  };
  
  const handleStart = () => {
    setIsRunning(true);
    
    // Update event status to in_progress
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
    
    // Update task status
    if (taskId) {
      const task = state.tasks.find((t) => t.id === taskId);
      if (task && task.status === 'pending') {
        updateTask({
          ...task,
          status: 'in_progress',
        });
      }
    }
  };
  
  const handlePause = () => {
    setIsRunning(false);
  };
  
  const handleStop = () => {
    setIsRunning(false);
    
    // Clear any running interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Call completion callback
    if (onSessionComplete && completedPomodoros > 0) {
      onSessionComplete(completedPomodoros, totalWorkTime);
    }
    
    // Reset timer
    setMode('work');
    setTimeLeft(workDuration * 60);
    setCompletedPomodoros(0);
    setTotalWorkTime(0);
  };
  
  const handleSkip = () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      startBreak(completedPomodoros);
    } else {
      setMode('work');
      setTimeLeft(workDuration * 60);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getProgress = () => {
    const totalDuration = mode === 'work' 
      ? workDuration * 60 
      : mode === 'short-break' 
      ? shortBreakDuration * 60 
      : longBreakDuration * 60;
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
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-6">
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
                {completedPomodoros} / {sessionsUntilLongBreak}
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
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{completedPomodoros}</p>
                <p className="text-xs text-muted-foreground">Pomodoros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{totalWorkTime}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
            </div>
          )}
          
          {/* Settings Info */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <p>
              Work: {workDuration}m • Short Break: {shortBreakDuration}m • Long Break: {longBreakDuration}m
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
