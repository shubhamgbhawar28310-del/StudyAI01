import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { googleCalendarService } from '@/services/googleCalendarService'
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Unlink
} from 'lucide-react'

export function GoogleCalendarSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isConnected, setIsConnected] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<any>(null)

  useEffect(() => {
    loadConnectionStatus()
  }, [user])

  const loadConnectionStatus = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const status = await googleCalendarService.getConnectionStatus(user.id)
      setIsConnected(status.connected)
      setConnectedEmail(status.email)
      
      if (status.connected) {
        await loadSyncStatus()
      }
    } catch (error) {
      console.error('Error loading connection status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    if (!user?.id) return
    
    try {
      const status = await googleCalendarService.getSyncStatus(user.id)
      setSyncStatus(status)
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  const handleConnect = () => {
    googleCalendarService.initiateOAuth()
    
    // Listen for OAuth completion
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'google-calendar-connected') {
        loadConnectionStatus()
        toast({
          title: 'Connected!',
          description: 'Google Calendar connected successfully',
        })
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // Cleanup listener after 5 minutes
    setTimeout(() => {
      window.removeEventListener('message', handleMessage)
    }, 5 * 60 * 1000)
  }

  const handleDisconnect = async () => {
    if (!user?.id) return
    
    const confirmed = window.confirm(
      'Are you sure you want to disconnect Google Calendar? Your events will no longer sync.'
    )
    
    if (!confirmed) return
    
    try {
      await googleCalendarService.disconnect(user.id)
      setIsConnected(false)
      setConnectedEmail(null)
      setSyncStatus(null)
      
      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected',
      })
    } catch (error: any) {
      console.error('Error disconnecting:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect',
        variant: 'destructive',
      })
    }
  }

  const handleManualSync = async () => {
    if (!user?.id) return
    
    setIsSyncing(true)
    try {
      const result = await googleCalendarService.syncAllEvents(user.id)
      
      await loadSyncStatus()
      
      toast({
        title: 'Sync Complete',
        description: result.stats 
          ? `Queued ${result.stats.queued} events for sync`
          : 'All events synced successfully',
      })
    } catch (error: any) {
      console.error('Error syncing:', error)
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync events',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Sync your study events and tasks to Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-start justify-between space-x-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900/20' 
                : 'bg-gray-100 dark:bg-gray-900/20'
            }`}>
              {isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Connection Status</p>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
              {connectedEmail && (
                <p className="text-sm text-muted-foreground">
                  Connected as: {connectedEmail}
                </p>
              )}
              {!isConnected && (
                <p className="text-sm text-muted-foreground">
                  Connect your Google Calendar to automatically sync events
                </p>
              )}
            </div>
          </div>
          {isConnected ? (
            <Button onClick={handleDisconnect} variant="outline" size="sm">
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} size="sm">
              <LinkIcon className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
        </div>

        {isConnected && (
          <>
            <Separator />

            {/* Sync Status */}
            {syncStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Sync Status</h4>
                  <Button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    variant="outline"
                    size="sm"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Schedule Events */}
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium">Schedule Events</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Synced:</span>
                        <span className="font-medium text-green-600">
                          {syncStatus.scheduleEvents.synced}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unsynced:</span>
                        <span className="font-medium text-orange-600">
                          {syncStatus.scheduleEvents.unsynced}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">
                          {syncStatus.scheduleEvents.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-500" />
                      <p className="text-sm font-medium">Tasks</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Synced:</span>
                        <span className="font-medium text-green-600">
                          {syncStatus.tasks.synced}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unsynced:</span>
                        <span className="font-medium text-orange-600">
                          {syncStatus.tasks.unsynced}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">
                          {syncStatus.tasks.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Queue Status */}
                {syncStatus.queue.total > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Sync in Progress
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {syncStatus.queue.pending} events pending, {syncStatus.queue.processing} processing
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Message */}
                {syncStatus.totalUnsynced > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        {syncStatus.totalUnsynced} Unsynced Events
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        Click "Sync Now" to push these events to Google Calendar
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <Separator />

            {/* How it Works */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">How it Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>New events are automatically synced to Google Calendar</li>
                <li>Updates to events are reflected in Google Calendar</li>
                <li>Deleted events are removed from Google Calendar</li>
                <li>Use "Sync Now" to manually sync existing events</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
