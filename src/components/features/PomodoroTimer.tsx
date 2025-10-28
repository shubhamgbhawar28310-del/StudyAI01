import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  CheckSquare,
  Timer,
  Coffee,
  Target
} from 'lucide-react'

interface PomodoroTimerProps {
  compactMode?: boolean
  showTaskSelection?: boolean
}

export function PomodoroTimer({ compactMode = false, showTaskSelection = true }: PomodoroTimerProps) {
  const { 
    state, 
    addPomodoroSession, 
    setCurrentPomodoroTask,
    updateTask
  } = useStudyPlanner()
  
  const [time, setTime] = useState(25 * 60) // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [workDuration, setWorkDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null)

  const currentTask = state.currentPomodoroTask
  const totalTime = isBreak 
    ? (sessions % 4 === 3 ? longBreakDuration : breakDuration) * 60 
    : workDuration * 60
  const progress = ((totalTime - time) / totalTime) * 100

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1)
      }, 1000)
    } else if (time === 0) {
      // Timer finished
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, time, isBreak, sessions])

  const handleTimerComplete = () => {
    const endTime = new Date().toISOString()
    
    if (!isBreak) {
      // Work session completed
      const session = {
        taskId: currentTask?.id,
        duration: workDuration * 60,
        completed: true,
        startTime: sessionStartTime || new Date().toISOString(),
        endTime,
        type: 'work' as const
      }
      
      addPomodoroSession(session)
      setSessions(prev => prev + 1)
      
      // Update task progress if linked
      if (currentTask) {
        const newProgress = Math.min(100, currentTask.progress + 25)
        updateTask({
          ...currentTask,
          progress: newProgress,
          pomodoroSessions: currentTask.pomodoroSessions + 1
        })
      }
      
      // Start break
      setIsBreak(true)
      const nextBreakDuration = sessions % 4 === 3 ? longBreakDuration : breakDuration
      setTime(nextBreakDuration * 60)
    } else {
      // Break completed
      const session = {
        taskId: currentTask?.id,
        duration: isBreak ? (sessions % 4 === 0 ? longBreakDuration : breakDuration) * 60 : 0,
        completed: true,
        startTime: sessionStartTime || new Date().toISOString(),
        endTime,
        type: (sessions % 4 === 0 ? 'long-break' : 'short-break') as const
      }
      
      addPomodoroSession(session)
      
      // Start work session
      setIsBreak(false)
      setTime(workDuration * 60)
    }
    
    setIsActive(false)
    setSessionStartTime(null)
    
    // Play notification sound (in a real app)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(isBreak ? 'Break complete! Time to work.' : 'Work session complete! Time for a break.')
    }
  }

  const toggleTimer = () => {
    if (!isActive) {
      setSessionStartTime(new Date().toISOString())
    }
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setTime(workDuration * 60)
    setIsBreak(false)
    setSessionStartTime(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTaskSelect = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId)
    if (task) {
      setCurrentPomodoroTask(task)
    }
  }

  const getSessionTypeInfo = () => {
    if (isBreak) {
      return sessions % 4 === 0 
        ? { type: 'Long Break', icon: Coffee, color: 'text-green-500' }
        : { type: 'Short Break', icon: Coffee, color: 'text-blue-500' }
    }
    return { type: 'Focus Time', icon: Target, color: 'text-red-500' }
  }

  const sessionInfo = getSessionTypeInfo()
  const SessionIcon = sessionInfo.icon

  if (compactMode) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-muted flex items-center justify-center">
                  <span className="text-sm font-bold">{formatTime(time)}</span>
                </div>
                <Progress 
                  value={progress} 
                  className="absolute inset-0 w-12 h-12 rounded-full"
                />
              </div>
              <div>
                <p className="font-medium">{sessionInfo.type}</p>
                <p className="text-xs text-muted-foreground">
                  Session {sessions + 1}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={toggleTimer}
                className="h-8 w-8 p-0"
              >
                {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetTimer}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              <span>Pomodoro Timer</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Session {sessions + 1}
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Task Selection */}
          {showTaskSelection && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Current Task
              </label>
              <Select 
                value={currentTask?.id || ''} 
                onValueChange={handleTaskSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task to focus on" />
                </SelectTrigger>
                <SelectContent>
                  {state.tasks.filter(t => !t.completed).map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                        {task.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentTask && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    <span className="font-medium">{currentTask.title}</span>
                  </div>
                  <div className="mt-1">
                    <Progress value={currentTask.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Progress: {currentTask.progress}% • Sessions: {currentTask.pomodoroSessions}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timer Display */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={isBreak ? "hsl(142 76% 36%)" : "hsl(346 87% 43%)"}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                  animate={{ 
                    strokeDashoffset: 2 * Math.PI * 70 * (1 - progress / 100)
                  }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <SessionIcon className={`h-6 w-6 mb-2 ${sessionInfo.color}`} />
                <span className="text-3xl font-bold">{formatTime(time)}</span>
                <span className="text-sm text-muted-foreground">
                  {sessionInfo.type}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={toggleTimer}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 transition-transform"
            >
              {isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outline" onClick={resetTimer} size="lg">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="text-xs text-muted-foreground">Work (min)</label>
              <Select 
                value={workDuration.toString()} 
                onValueChange={(value) => {
                  setWorkDuration(parseInt(value))
                  if (!isActive && !isBreak) {
                    setTime(parseInt(value) * 60)
                  }
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 20, 25, 30, 45, 60].map(duration => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Break (min)</label>
              <Select 
                value={breakDuration.toString()} 
                onValueChange={(value) => setBreakDuration(parseInt(value))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 10, 15].map(duration => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Long Break</label>
              <Select 
                value={longBreakDuration.toString()} 
                onValueChange={(value) => setLongBreakDuration(parseInt(value))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 20, 30, 45].map(duration => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="text-center pt-4 border-t">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-red-500">{sessions}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">
                  {Math.floor(state.userStats.totalStudyTime / 60)}h
                </p>
                <p className="text-xs text-muted-foreground">Total Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {state.userStats.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}