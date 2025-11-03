import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTheme } from '@/components/theme-provider'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
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
  Shield,
  Download,
  Trash2,
  Key,
  Globe,
  Target,
  Timer,
  Coffee,
  Play,
  Save,
  AlertTriangle,
  Loader2,
  Mail,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialSettingsRef = useRef<string>('')

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
      
      if (!userSettings) {
        try {
          userSettings = await initializeUserSettings(
            user.id,
            user.email || '',
            user.user_metadata?.full_name
          )
          userSettings.theme = theme
        } catch (initError) {
          console.error('Error initializing settings:', initError)
          userSettings = {
            user_id: user.id,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            theme: theme,
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
        if (userSettings.theme !== theme) {
          userSettings.theme = theme
        }
      }
      
      setSettings(userSettings)
      initialSettingsRef.current = JSON.stringify(userSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
      
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
        description: 'Could not load saved settings. Using defaults.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (settings && initialSettingsRef.current) {
      const currentSettings = JSON.stringify(settings)
      setHasChanges(currentSettings !== initialSettingsRef.current)
    }
  }, [settings])

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
      
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        toast({
          title: 'Database Not Setup',
          description: 'Please run the USER_SETTINGS_SETUP.sql migration in Supabase first.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save settings.',
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-end gap-2"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Unsaved changes
          </span>
          <Button 
            onClick={() => handleSaveChanges(false)}
            disabled={isSaving}
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
        </motion.div>
      )}

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your personal information and account details
          </CardDescription>
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
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={settings.display_name || ''}
                  onChange={(e) => updateSetting('display_name', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-2 flex-1">
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
          <CardDescription>
            Customize how StudyAI looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Selection */}
          <div className="flex items-start space-x-3">
            <div className="mt-1 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
              <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor }
                ].map((themeOption) => {
                  const Icon = themeOption.icon
                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => updateSetting('theme', themeOption.value as 'light' | 'dark' | 'system')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        settings.theme === themeOption.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{themeOption.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Language */}
          <div className="flex items-start space-x-3">
            <div className="mt-1 p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2 flex-1">
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
          <CardDescription>
            Configure your study sessions and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start space-x-3">
            <div className="mt-1 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="dailyGoal">Daily Study Goal (hours)</Label>
              <Input
                id="dailyGoal"
                type="number"
                min="1"
                max="12"
                value={settings.daily_study_goal}
                onChange={(e) => updateSetting('daily_study_goal', parseInt(e.target.value) || 4)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <div className="mt-1 p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Timer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="pomodoroLength">Pomodoro Length (minutes)</Label>
              <Input
                id="pomodoroLength"
                type="number"
                min="15"
                max="60"
                value={settings.pomodoro_length}
                onChange={(e) => updateSetting('pomodoro_length', parseInt(e.target.value) || 25)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <div className="mt-1 p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Coffee className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="breakLength">Break Length (minutes)</Label>
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

          <Separator />

          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor="autoStartBreaks" className="text-base font-medium cursor-pointer">
                  Auto-start Breaks
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start break timer after work session
                </p>
              </div>
            </div>
            <Switch
              id="autoStartBreaks"
              checked={settings.auto_start_breaks}
              onCheckedChange={(checked) => updateSetting('auto_start_breaks', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section - Enhanced Component */}
      <NotificationSettings />

      {/* Privacy & Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Manage your account security and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Change Password */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowPasswordDialog(!showPasswordDialog)}
              variant="outline"
            >
              {showPasswordDialog ? 'Cancel' : 'Change'}
            </Button>
          </div>

          {showPasswordDialog && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 border rounded-lg space-y-3 ml-11"
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
              <Button onClick={handleChangePassword} size="sm" className="w-full">
                Update Password
              </Button>
            </motion.div>
          )}

          <Separator />

          {/* Export Data */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your data as JSON
                </p>
              </div>
            </div>
            <Button onClick={handleExportData} variant="outline">
              Export
            </Button>
          </div>

          <Separator />

          {/* Delete Account */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
            </div>
            <Button onClick={handleDeleteAccount} variant="destructive">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
