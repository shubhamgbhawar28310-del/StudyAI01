import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function GoogleCalendarSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSync = async () => {
    if (!user?.id) {
      toast({
        title: '❌ Error',
        description: 'You must be logged in to sync',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);

    try {
      console.log('🔄 Step 1: Queuing all unsynced events...');

      // STEP 1: Call batch-sync to queue all existing unsynced events
      const { data: batchData, error: batchError } = await supabase.functions.invoke(
        'google-calendar-batch-sync',
        { body: { userId: user.id } }
      );

      if (batchError) {
        console.error('❌ Batch sync error:', batchError);
        throw batchError;
      }

      console.log('✅ Batch sync response:', batchData);

      const queuedCount = batchData?.stats?.queued || 0;

      // STEP 2: Process the queue
      console.log('🔄 Step 2: Processing sync queue...');

      const { data: workerData, error: workerError } = await supabase.functions.invoke(
        'google-calendar-worker'
      );

      if (workerError) {
        console.error('❌ Worker error:', workerError);
        throw workerError;
      }

      console.log('✅ Worker response:', workerData);

      const results = workerData?.results || { processed: 0, failed: 0 };

      // Show success message
      if (queuedCount > 0 || results.processed > 0) {
        toast({
          title: '✅ Sync Complete!',
          description: `Queued ${queuedCount} events, processed ${results.processed} events${
            results.failed > 0 ? `, ${results.failed} failed` : ''
          }`,
        });
      } else {
        toast({
          title: 'ℹ️ All Synced',
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
