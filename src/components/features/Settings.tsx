import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/components/theme-provider'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Palette,
  Clock,
  Bell,
  Shield,
  Download,
  Trash2,
  Key,
  Globe,
  Target,
  Timer,
  Coffee,
  Play,
  Calendar,
  CheckCircle,
  BarChart3,
  Save,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsState {
  profile: {
    displayName: string
    email: string
  }
  appearance: {
    theme: string
    language: string
  }
  studyPreferences: {
    dailyGoal: number
    pomodoroLength: number
    breakLength: number
    autoStartBreaks: boolean
  }
  notifications: {
    studyReminders: boolean
    taskDeadlines: boolean
    achievements: boolean
    weeklyReport: boolean
  }
}

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { state, dispatch } = useStudyPlanner()
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Initialize settings with actual user data
  const [settings, setSettings] = useState<SettingsState>({
    profile: {
      displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
      email: user?.email || ''
    },
    appearance: {
      theme: theme,
      language: 'English'
    },
    studyPreferences: {
      dailyGoal: 4,
      pomodoroLength: 25,
      breakLength: 5,
      autoStartBreaks: true
    },
    notifications: {
      studyReminders: true,
      taskDeadlines: true,
      achievements: true,
      weeklyReport: false
    }
  })
  
  // Load user preferences from Supabase when component mounts
  useEffect(() => {
    loadUserPreferences()
  }, [user])

  const loadUserPreferences = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data && !error) {
        setSettings(prev => ({
          ...prev,
          profile: {
            displayName: data.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
            email: user?.email || ''
          },
          studyPreferences: {
            dailyGoal: data.daily_goal || 4,
            pomodoroLength: data.pomodoro_length || 25,
            breakLength: data.break_length || 5,
            autoStartBreaks: data.auto_start_breaks ?? true
          },
          notifications: {
            studyReminders: data.study_reminders ?? true,
            taskDeadlines: data.task_deadlines ?? true,
            achievements: data.achievements ?? true,
            weeklyReport: data.weekly_report ?? false
          }
        }))
      }
    } catch (error) {
      console.log('No existing preferences, using defaults')
    }
  }

  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSaveChanges = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Update user metadata for display name
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: settings.profile.displayName }
      })
      
      if (updateError) throw updateError
      
      // Save preferences to database
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          display_name: settings.profile.displayName,
          daily_goal: settings.studyPreferences.dailyGoal,
          pomodoro_length: settings.studyPreferences.pomodoroLength,
          break_length: settings.studyPreferences.breakLength,
          auto_start_breaks: settings.studyPreferences.autoStartBreaks,
          study_reminders: settings.notifications.studyReminders,
          task_deadlines: settings.notifications.taskDeadlines,
          achievements: settings.notifications.achievements,
          weekly_report: settings.notifications.weeklyReport,
          updated_at: new Date().toISOString()
        })
      
      if (upsertError) throw upsertError
      
      // Update theme if changed
      if (settings.appearance.theme !== theme) {
        setTheme(settings.appearance.theme as 'light' | 'dark' | 'system')
      }
      
      toast({
        title: "Success",
        description: "Settings saved successfully!"
      })
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    const dataToExport = {
      profile: settings.profile,
      tasks: state.tasks,
      flashcards: state.flashcards,
      studyStats: state.userStats,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `studyai-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you absolutely sure? This action cannot be undone and will permanently delete your account and all associated data.')) {
      alert('Account deletion would be processed here. This is a demo.')
      setShowDeleteConfirm(false)
    }
  }

  const handleChangePassword = () => {
    alert('Password change dialog would open here. This is a demo.')
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Customize your study preferences
        </p>
      </div>

      {/* Save Button - Fixed at top */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveChanges}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg">
                {settings.profile.displayName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{settings.profile.displayName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">Level {state.userStats.level}</Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{state.userStats.xp} XP</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={settings.profile.displayName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, displayName: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.profile.email}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, email: e.target.value }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settings.appearance.theme}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, theme: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose your preferred theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={settings.appearance.language}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, language: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Español</SelectItem>
                  <SelectItem value="French">Français</SelectItem>
                  <SelectItem value="German">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Study Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyGoal" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Daily Study Goal (hours)
              </Label>
              <Input
                id="dailyGoal"
                type="number"
                min="1"
                max="12"
                value={settings.studyPreferences.dailyGoal}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  studyPreferences: { ...prev.studyPreferences, dailyGoal: parseInt(e.target.value) || 4 }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pomodoroLength" className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Pomodoro Session Length (minutes)
              </Label>
              <Input
                id="pomodoroLength"
                type="number"
                min="15"
                max="60"
                value={settings.studyPreferences.pomodoroLength}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  studyPreferences: { ...prev.studyPreferences, pomodoroLength: parseInt(e.target.value) || 25 }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakLength" className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Break Length (minutes)
              </Label>
              <Input
                id="breakLength"
                type="number"
                min="5"
                max="30"
                value={settings.studyPreferences.breakLength}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  studyPreferences: { ...prev.studyPreferences, breakLength: parseInt(e.target.value) || 5 }
                }))}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <Label htmlFor="autoStartBreaks">Auto-start Breaks</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically start break timer
              </p>
            </div>
            <Switch
              id="autoStartBreaks"
              checked={settings.studyPreferences.autoStartBreaks}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                studyPreferences: { ...prev.studyPreferences, autoStartBreaks: checked }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: 'studyReminders',
              icon: Calendar,
              title: 'Study Reminders',
              description: 'Daily study session reminders'
            },
            {
              key: 'taskDeadlines',
              icon: AlertTriangle,
              title: 'Task Deadlines',
              description: 'Alerts for upcoming deadlines'
            },
            {
              key: 'achievements',
              icon: CheckCircle,
              title: 'Achievements',
              description: 'Notifications for unlocked achievements'
            },
            {
              key: 'weeklyReport',
              icon: BarChart3,
              title: 'Weekly Report',
              description: 'Weekly progress summary'
            }
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <Label htmlFor={item.key}>{item.title}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch
                  id={item.key}
                  checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, [item.key]: checked }
                  }))}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Privacy & Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              className="w-full justify-start"
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            
            <Button
              variant="outline"
              onClick={handleExportData}
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Data Export
            </Button>
            
            <Separator />
            
            <div className="space-y-2">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
              
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 border border-destructive rounded-lg bg-destructive/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">Danger Zone</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                    >
                      Yes, delete my account
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}