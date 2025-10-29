import { useEffect, useState } from 'react';
import { CloudOff, Loader2 } from 'lucide-react';
import { dataSyncService, type SyncStatus } from '@/services/dataSyncService';
import { cn } from '@/lib/utils';

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const unsubscribe = dataSyncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
      
      // Only show for syncing and error states
      if (status === 'syncing') {
        setShowMessage(true);
      } else if (status === 'synced') {
        // Hide after a brief moment
        setTimeout(() => setShowMessage(false), 800);
      } else if (status === 'error') {
        setShowMessage(true);
        // Auto-hide error after 5 seconds
        setTimeout(() => setShowMessage(false), 5000);
      } else {
        setShowMessage(false);
      }
    });

    return unsubscribe;
  }, []);

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: Loader2,
          text: 'Syncing...',
          className: 'text-blue-600 dark:text-blue-400',
          iconClassName: 'animate-spin',
        };
      case 'error':
        return {
          icon: CloudOff,
          text: 'Sync error',
          className: 'text-red-600 dark:text-red-400',
          iconClassName: '',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  
  // Don't show anything if idle or synced
  if (!showMessage || !config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm',
        'border border-gray-200 dark:border-gray-700',
        'shadow-lg',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        config.className
      )}
    >
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <span className="hidden sm:inline">{config.text}</span>
    </div>
  );
}
