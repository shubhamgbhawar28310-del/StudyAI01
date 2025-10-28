import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function DatabaseSetupWarning() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkDatabaseSetup();
  }, []);

  const checkDatabaseSetup = async () => {
    try {
      // Try to query the tasks table
      const { error } = await supabase.from('tasks').select('count').limit(1);
      
      if (error) {
        // If error contains "does not exist", tables aren't set up
        if (error.message.includes('does not exist') || error.message.includes('relation')) {
          setIsSetup(false);
        } else {
          // Other errors (like RLS) mean tables exist
          setIsSetup(true);
        }
      } else {
        setIsSetup(true);
      }
    } catch (err) {
      console.error('Error checking database setup:', err);
      setIsSetup(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Don't show anything while checking
  if (isChecking) {
    return null;
  }

  // Don't show if database is set up
  if (isSetup) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/50 to-transparent">
      <Alert className="max-w-4xl mx-auto border-orange-500 bg-orange-50 dark:bg-orange-950">
        <AlertCircle className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-orange-900 dark:text-orange-100 font-semibold">
          ⚠️ Database Setup Required
        </AlertTitle>
        <AlertDescription className="text-orange-800 dark:text-orange-200 mt-2">
          <p className="mb-3">
            Your Supabase database tables haven't been created yet. Your data will only be saved locally and will be lost on logout.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => window.open('/diagnostic.html', '_blank')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Run Diagnostic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://app.supabase.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Supabase Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/FIX_DATA_NOT_SAVING.md';
                link.download = 'FIX_DATA_NOT_SAVING.md';
                link.click();
              }}
            >
              📖 View Setup Guide
            </Button>
          </div>
          <p className="text-xs mt-3 opacity-75">
            Quick fix: Go to Supabase Dashboard → SQL Editor → Run the migration file from <code className="bg-orange-200 dark:bg-orange-900 px-1 rounded">supabase/migrations/create_user_data_tables.sql</code>
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
