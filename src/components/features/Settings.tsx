import { useState, useEffect, useCallback, useRef } from 'react'
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
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  getUserSettings,
  upsertUserSettings,
  initializeUserSettings,
  exportUserData,
  changePassword,
  deleteUserAccount,
  UserSettings
} from '@/services/settingsService'
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
  AlertTriangle,
  Loader2
} from 'lucide-react'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialSettingsRef = useRef<string>('')

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      let userSettings = await getUserSettings(user.id)
      
      // If no settings exist, initialize them with current theme
      if (!userSettings) {
        try {
          userSettings = await initializeUserSettings(
            user.id,
            user.email || '',
            user.user_metadata?.full_name
          )
          // Set theme to current theme from context
          userSettings.theme = theme
        } catch (initError) {
          console.error('Error initializing settings:', initError)
          // If initialization fails, use default settings with current theme
          userSettings = {
            user_id: user.id,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            theme: theme, // Use current theme from context
            language: 'English',
            daily_study_goal: 4,
            pomodoro_length: 25,
            break_length: 5,
            auto_start_breaks: true,
            study_reminders: false,
            task_deadlines: false,
            achievements: false,
            weekly_report: false
          }
        }
      } else {
        // If settings exist but theme is different from current, use current theme
        // This ensures sidebar changes are respected
        if (userSettings.theme !== theme) {
          userSettings.theme = theme
        }
      }
      
      setSettings(userSettings)
      initialSettingsRef.current = JSON.stringify(userSettings)
      
      // Don't apply theme here since it's already set from context
      // This prevents overwriting sidebar changes
    } catch (error) {
      console.error('Error loading settings:', error)
      
      // Fallback to default settings if loading fails
      const defaultSettings: UserSettings = {
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        theme: 'system',
        language: 'English',
        daily_study_goal: 4,
        pomodoro_length: 25,
        break_length: 5,
        auto_start_breaks: true,
        study_reminders: false,
        task_deadlines: false,
        achievements: false,
        weekly_report: false
      }
      
      setSettings(defaultSettings)
      initialSettingsRef.current = JSON.stringify(defaultSettings)
      
      toast({
        title: 'Using Default Settings',
        description: 'Could not load saved settings. Using defaults. Please run the database migration.',
        variant: 'default'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check for changes
  useEffect(() => {
    if (settings && initialSettingsRef.current) {
      const currentSettings = JSON.stringify(settings)
      setHasChanges(currentSettings !== initialSettingsRef.current)
    }
  }, [settings])

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (hasChanges && settings && !isSaving) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSaveChanges(true)
      }, 2000)
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [hasChanges, settings])

  const handleSaveChanges = async (isAutoSave = false) => {
    if (!user?.id || !settings) return
    
    setIsSaving(true)
    try {
      await upsertUserSettings({
        ...settings,
        user_id: user.id
      })
      
      // Update theme if changed
      if (settings.theme) {
        setTheme(settings.theme)
      }
      
      initialSettingsRef.current = JSON.stringify(settings)
      setHasChanges(false)
      
      toast({
        title: 'Success',
        description: isAutoSave ? 'Settings auto-saved' : 'Settings saved successfully!'
      })
    } catch (error: any) {
      console.error('Error saving settings:', error)
      
      // Check if it's a table not found error
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        toast({
          title: 'Database Not Setup',
          description: 'Please run the USER_SETTINGS_SETUP.sql migration in Supabase first.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save settings. Changes will be kept locally.',
          variant: 'destructive'
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = async () => {
    if (!user?.id) return
    
    try {
      const data = await exportUserData(user.id)
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
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
      
      toast({
        title: 'Success',
        description: 'Data exported successfully!'
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive'
      })
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      })
      return
    }
    
    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      })
      return
    }
    
    try {
      await changePassword(newPassword)
      
      toast({
        title: 'Success',
        description: 'Password changed successfully!'
      })
      
      setShowPasswordDialog(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.id) return
    
    const confirmed = window.confirm(
      'Are you absolutely sure? This action cannot be undone and will permanently delete your account and all associated data.'
    )
    
    if (!confirmed) return
    
    try {
      await deleteUserAccount(user.id)
      
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted'
      })
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive'
      })
    }
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null)
    
    // If theme is being updated, apply it immediately
    if (key === 'theme' && typeof value === 'string') {
      setTheme(value as 'light' | 'dark' | 'system')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!settings && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-6">
        <AlertTriangle className="h-12 w-12 text-orange-500" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Settings Not Available</h2>
          <p className="text-muted-foreground max-w-md">
            Unable to load settings. Please ensure the database migration has been run.
          </p>
          <Button onClick={loadSettings} className="mt-4">
            <Loader2 className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
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
      <div className="flex justify-end gap-2">
        {hasChanges && (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Unsaved changes
          </span>
        )}
        <Button 
          onClick={() => handleSaveChanges(false)}
          disabled={!hasChanges || isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
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
                {(settings.display_name || 'U')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{settings.display_name}</h3>
              <p className="text-sm text-muted-foreground">{settings.email}</p>
            </div>
          </div>

          <Separator />

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={settings.display_name || ''}
                onChange={(e) => updateSetting('display_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
                value={settings.theme}
                onValueChange={(value) => updateSetting('theme', value as 'light' | 'dark' | 'system')}
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
                value={settings.language}
                onValueChange={(value) => updateSetting('language', value)}
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
                value={settings.daily_study_goal}
                onChange={(e) => updateSetting('daily_study_goal', parseInt(e.target.value) || 4)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pomodoroLength" className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Pomodoro Length (minutes)
              </Label>
              <Input
                id="pomodoroLength"
                type="number"
                min="15"
                max="60"
                value={settings.pomodoro_length}
                onChange={(e) => updateSetting('pomodoro_length', parseInt(e.target.value) || 25)}
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
                value={settings.break_length}
                onChange={(e) => updateSetting('break_length', parseInt(e.target.value) || 5)}
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
                Automatically start break timer after work session
              </p>
            </div>
            <Switch
              id="autoStartBreaks"
              checked={settings.auto_start_breaks}
              onCheckedChange={(checked) => updateSetting('auto_start_breaks', checked)}
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
              key: 'study_reminders' as const,
              icon: Calendar,
              title: 'Study Reminders',
              description: 'Daily study session reminders'
            },
            {
              key: 'task_deadlines' as const,
              icon: AlertTriangle,
              title: 'Task Deadlines',
              description: 'Alerts for upcoming deadlines'
            },
            {
              key: 'achievements' as const,
              icon: CheckCircle,
              title: 'Achievements',
              description: 'Notifications for unlocked achievements'
            },
            {
              key: 'weekly_report' as const,
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
                  checked={settings[item.key]}
                  onCheckedChange={(checked) => updateSetting(item.key, checked)}
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
              onClick={() => setShowPasswordDialog(!showPasswordDialog)}
              className="w-full justify-start"
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            
            {showPasswordDialog && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} size="sm">
                    Update Password
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPasswordDialog(false)
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
            
            <Button
              variant="outline"
              onClick={handleExportData}
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
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
