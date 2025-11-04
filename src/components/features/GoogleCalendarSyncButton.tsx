import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function GoogleCalendarSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      console.log('🔄 Triggering Google Calendar sync...');

      // Call the worker function
      const { data, error } = await supabase.functions.invoke('google-calendar-worker');

      if (error) {
        console.error('❌ Sync error:', error);
        throw error;
      }

      console.log('✅ Sync response:', data);

      const results = data?.results || { processed: 0, failed: 0 };

      if (results.processed > 0) {
        toast({
          title: '✅ Sync Complete!',
          description: `${results.processed} event(s) synced to Google Calendar${
            results.failed > 0 ? `, ${results.failed} failed` : ''
          }`,
        });
      } else if (results.failed > 0) {
        toast({
          title: '⚠️ Sync Issues',
          description: `${results.failed} event(s) failed to sync. Check your connection.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'ℹ️ Nothing to Sync',
          description: 'All events are already synced to Google Calendar',
        });
      }
    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      toast({
        title: '❌ Sync Failed',
        description: error.message || 'Failed to sync with Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Sync to Calendar
        </>
      )}
    </Button>
  );
}
