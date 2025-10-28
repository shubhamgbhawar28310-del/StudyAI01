import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  CheckSquare,
  Brain,
  Timer,
  Calendar,
  Award,
  Flame,
  Star
} from 'lucide-react'

interface ProgressTrackerProps {
  compactMode?: boolean
  showHeader?: boolean
}

export function ProgressTracker({ compactMode = false, showHeader = true }: ProgressTrackerProps) {
  const { state } = useStudyPlanner()

  // Calculate statistics with safe fallbacks
  const completionRate = state.userStats?.totalTasks > 0 
    ? (state.userStats.completedTasks / state.userStats.totalTasks) * 100 
    : 0

  const averageTaskProgress = state.tasks?.length > 0
    ? state.tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / state.tasks.length
    : 0

  const totalPomodoroSessions = state.pomodoroSessions?.filter(s => s.completed).length || 0
  const todaysSessions = state.pomodoroSessions?.filter(s => {
    const today = new Date().toDateString()
    return new Date(s.startTime).toDateString() === today && s.completed
  }).length || 0

  const flashcardAccuracy = state.flashcards?.length > 0
    ? state.flashcards
        .filter(c => c.reviewCount > 0)
        .reduce((sum, card) => sum + (card.correctCount / card.reviewCount), 0) / 
      state.flashcards.filter(c => c.reviewCount > 0).length * 100
    : 0

  const subjectBreakdown = state.tasks?.reduce((acc, task) => {
    if (task.subject) {
      acc[task.subject] = (acc[task.subject] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>) || {}

  const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayTasks = state.tasks?.filter(task => {
      const taskDate = new Date(task.createdAt).toDateString()
      return taskDate === date.toDateString()
    }) || []
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: dayTasks.filter(t => t.completed).length,
      total: dayTasks.length
    }
  })

  const achievements = [
    {
      id: 'first_task',
      title: 'First Steps',
      description: 'Created your first task',
      icon: CheckSquare,
      unlocked: (state.tasks?.length || 0) > 0,
      color: 'text-blue-500'
    },
    {
      id: 'task_master',
      title: 'Task Master',
      description: 'Completed 10 tasks',
      icon: Target,
      unlocked: (state.userStats?.completedTasks || 0) >= 10,
      color: 'text-green-500'
    },
    {
      id: 'pomodoro_pro',
      title: 'Pomodoro Pro',
      description: 'Completed 25 pomodoro sessions',
      icon: Timer,
      unlocked: totalPomodoroSessions >= 25,
      color: 'text-red-500'
    },
    {
      id: 'flashcard_scholar',
      title: 'Flashcard Scholar',
      description: 'Created 50 flashcards',
      icon: Brain,
      unlocked: (state.flashcards?.length || 0) >= 50,
      color: 'text-purple-500'
    },
    {
      id: 'streak_keeper',
      title: 'Streak Keeper',
      description: '7-day study streak',
      icon: Flame,
      unlocked: (state.userStats?.currentStreak || 0) >= 7,
      color: 'text-orange-500'
    },
    {
      id: 'level_up',
      title: 'Level Up',
      description: 'Reached level 5',
      icon: Star,
      unlocked: (state.userStats?.level || 0) >= 5,
      color: 'text-yellow-500'
    }
  ]

  const unlockedAchievements = achievements.filter(a => a.unlocked)

  if (compactMode) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{totalPomodoroSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{state.userStats?.level || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{state.userStats?.currentStreak || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h2 className="text-2xl font-bold">Progress & Analytics</h2>
          <p className="text-muted-foreground">Track your learning journey and achievements</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Task Completion</p>
                  <p className="text-3xl font-bold">{Math.round(completionRate)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {state.userStats?.completedTasks || 0} of {state.userStats?.totalTasks || 0} tasks
                  </p>
                </div>
                <CheckSquare className="h-8 w-8 text-green-500" />
              </div>
              <Progress value={completionRate} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Time</p>
                  <p className="text-3xl font-bold">{Math.floor((state.userStats?.totalStudyTime || 0) / 60)}h</p>
                  <p className="text-xs text-muted-foreground">
                    {todaysSessions} sessions today
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Daily Goal: 2h</span>
                  <span>{Math.round((todaysSessions * 25) / 120 * 100)}%</span>
                </div>
                <Progress value={(todaysSessions * 25) / 120 * 100} className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Level & XP</p>
                  <p className="text-3xl font-bold">Level {state.userStats?.level || 1}</p>
                  <p className="text-xs text-muted-foreground">
                    {state.userStats?.xp || 0} XP
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Next Level</span>
                  <span>{state.userStats?.xpToNextLevel || 100} XP to go</span>
                </div>
                <Progress 
                  value={((state.userStats?.xp || 0) % 100)} 
                  className="mt-1" 
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Streak</p>
                  <p className="text-3xl font-bold">{state.userStats?.currentStreak || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    days in a row
                  </p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                  Keep it up! 🔥
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyProgress.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-xs text-muted-foreground mb-2">{day.day}</p>
                <div className="bg-muted rounded-lg p-3">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium">{day.completed}/{day.total}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Subject Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(subjectBreakdown).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No subjects assigned yet
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(subjectBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([subject, count]) => (
                    <div key={subject} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{subject}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(count / (state.tasks?.length || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
              <Badge variant="secondary">{unlockedAchievements.length}/{achievements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      achievement.unlocked 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                        : 'border-muted bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${achievement.unlocked ? achievement.color : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium ${achievement.unlocked ? '' : 'text-muted-foreground'}`}>
                        {achievement.title}
                      </span>
                    </div>
                    <p className={`text-xs ${achievement.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                      {achievement.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}