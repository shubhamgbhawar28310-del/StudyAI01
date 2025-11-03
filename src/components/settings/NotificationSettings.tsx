// Notification Settings Component
// Beautiful UI for managing study reminders, task alerts, and achievements

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Calendar, 
  Trophy, 
  Clock, 
  Mail, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { reminderSettingsService } from '@/services/reminderSettingsService';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enable_study_reminders: true,
    enable_task_reminders: true,
    reminder_time: 30,
    enable_email_alerts: false,
    enable_achievement_notifications: true,
    enable_weekly_reports: true,
    google_calendar_connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    const data = await reminderSettingsService.getReminderSettings(user.id);
    if (data) {
      setSettings(data);
    }
  };

  const checkNotificationPermission = async () => {
    const status = await notificationService.checkPermission();
    setPermissionStatus(status);
  };

  const requestNotificationPermission = async () => {
    const status = await notificationService.requestPermission();
    setPermissionStatus(status);
    
    if (status === 'granted') {
      toast({
        title: 'Notifications enabled!',
        description: 'You will now receive study reminders and alerts.',
      });
    } else {
      toast({
        title: 'Notifications blocked',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    if (!user) return;
    
    // Check permission for notification toggles
    if ((key === 'enable_study_reminders' || key === 'enable_task_reminders' || key === 'enable_achievement_notifications') && value) {
      if (permissionStatus !== 'granted') {
        await requestNotificationPermission();
        if (notificationService.getPermissionStatus() !== 'granted') {
          return;
        }
      }
    }

    setLoading(true);
    try {
      await reminderSettingsService.updateReminderSettings(user.id, { [key]: value });
      setSettings((prev) => ({ ...prev, [key]: value }));
      toast({
        title: 'Settings updated',
      });
    } catch (error) {
      toast({
        title: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReminderTimeChange = async (value: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const time = parseInt(value);
      await reminderSettingsService.updateReminderSettings(user.id, { reminder_time: time });
      setSettings((prev) => ({ ...prev, reminder_time: time }));
      toast({
        title: 'Reminder time updated',
      });
    } catch (error) {
      toast({
        title: 'Failed to update reminder time',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  // Check Google Calendar connection status on mount
  useEffect(() => {
    checkGoogleCalendarStatus();
  }, [user]);

  const checkGoogleCalendarStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('google_calendar_connected, google_calendar_email')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setSettings(prev => ({
          ...prev,
          google_calendar_connected: data.google_calendar_connected || false
        }));
        setConnectedEmail(data.google_calendar_email);
      }
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    if (settings.google_calendar_connected) {
      // Disconnect
      if (!confirm('Are you sure you want to disconnect Google Calendar? This will stop syncing your events.')) {
        return;
      }

      setIsConnecting(true);
      try {
        const { googleCalendarService } = await import('@/services/googleCalendarService');
        await googleCalendarService.disconnect(user!.id);
        
        setSettings(prev => ({ ...prev, google_calendar_connected: false }));
        setConnectedEmail(null);
        
        toast({
          title: 'Disconnected',
          description: 'Google Calendar has been disconnected.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to disconnect Google Calendar.',
          variant: 'destructive',
        });
      } finally {
        setIsConnecting(false);
      }
    } else {
      // Connect
      setIsConnecting(true);
      try {
        const { googleCalendarService } = await import('@/services/googleCalendarService');
        
        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data.type === 'google-calendar-auth') {
            if (event.data.success) {
              setSettings(prev => ({ ...prev, google_calendar_connected: true }));
              setConnectedEmail(event.data.email);
              
              toast({
                title: 'Connected!',
                description: `Google Calendar connected as ${event.data.email}`,
              });
              
              // Initial sync will happen automatically via the background worker
            } else {
              toast({
                title: 'Connection canceled',
                description: 'Google Calendar connection was canceled.',
              });
            }
            setIsConnecting(false);
            window.removeEventListener('message', handleMessage);
          }
        };

        window.addEventListener('message', handleMessage);
        
        // Initiate OAuth flow
        googleCalendarService.initiateOAuth();
        
        // Timeout after 2 minutes
        setTimeout(() => {
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
        }, 120000);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to connect Google Calendar.',
          variant: 'destructive',
        });
        setIsConnecting(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notifications & Reminders</h2>
        <p className="text-muted-foreground mt-1">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Permission Status Banner */}
      {permissionStatus !== 'granted' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-900 dark:text-amber-100">
                Enable Browser Notifications
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Allow notifications to receive study reminders and deadline alerts
              </p>
              <Button
                onClick={requestNotificationPermission}
                size="sm"
                className="mt-3"
                variant="default"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Study Reminders */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor="study-reminders" className="text-base font-medium cursor-pointer">
                  Study Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified before your scheduled study sessions start
                </p>
              </div>
            </div>
            <Switch
              id="study-reminders"
              checked={settings.enable_study_reminders}
              onCheckedChange={(checked) => handleToggle('enable_study_reminders', checked)}
              disabled={loading}
            />
          </div>

          <Separator />

          {/* Task Deadline Alerts */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1 p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor="task-reminders" className="text-base font-medium cursor-pointer">
                  Task Deadline Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts before task deadlines approach
                </p>
              </div>
            </div>
            <Switch
              id="task-reminders"
              checked={settings.enable_task_reminders}
              onCheckedChange={(checked) => handleToggle('enable_task_reminders', checked)}
              disabled={loading}
            />
          </div>

          <Separator />

          {/* Achievement Notifications */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor="achievement-notifications" className="text-base font-medium cursor-pointer">
                  Achievement Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate your progress with achievement unlocks
                </p>
              </div>
            </div>
            <Switch
              id="achievement-notifications"
              checked={settings.enable_achievement_notifications}
              onCheckedChange={(checked) => handleToggle('enable_achievement_notifications', checked)}
              disabled={loading}
            />
          </div>

          <Separator />

          {/* Reminder Time */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1 p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor="reminder-time" className="text-base font-medium">
                  Reminder Timing
                </Label>
                <p className="text-sm text-muted-foreground">
                  How early to remind you before events
                </p>
              </div>
            </div>
            <Select
              value={settings.reminder_time.toString()}
              onValueChange={handleReminderTimeChange}
              disabled={loading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutes before</SelectItem>
                <SelectItem value="30">30 minutes before</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
                <SelectItem value="120">2 hours before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Email Alerts */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1 p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                <Mail className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor="email-alerts" className="text-base font-medium cursor-pointer">
                  Email Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications when you're offline
                </p>
              </div>
            </div>
            <Switch
              id="email-alerts"
              checked={settings.enable_email_alerts}
              onCheckedChange={(checked) => handleToggle('enable_email_alerts', checked)}
              disabled={loading}
            />
          </div>

          <Separator />

          {/* Weekly Reports */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor="weekly-reports" className="text-base font-medium cursor-pointer">
                  Weekly Progress Reports
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get a summary of your weekly achievements and progress
                </p>
              </div>
            </div>
            <Switch
              id="weekly-reports"
              checked={settings.enable_weekly_reports}
              onCheckedChange={(checked) => handleToggle('enable_weekly_reports', checked)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Sync
          </CardTitle>
          <CardDescription>
            Sync your StudyAI schedule with Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Google Calendar</p>
                <p className="text-sm text-muted-foreground">
                  {settings.google_calendar_connected && connectedEmail
                    ? `✅ Connected as ${connectedEmail}`
                    : 'Not connected'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleConnectGoogleCalendar}
              variant={settings.google_calendar_connected ? 'outline' : 'default'}
              disabled={loading || isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : settings.google_calendar_connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Connect Calendar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>


    </motion.div>
  );
}
