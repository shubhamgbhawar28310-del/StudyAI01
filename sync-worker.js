// Google Calendar Sync Worker
// Runs every 5 minutes to sync events to Google Calendar

const SUPABASE_URL = 'https://crdqpioymuvnzhtgrenj.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key-here';

async function triggerSync() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🔄 Triggering Google Calendar sync...`);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/google-calendar-worker`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log(`[${timestamp}] ✅ Sync completed successfully!`);
      console.log(`   - Processed: ${data.results?.processed || 0} events`);
      console.log(`   - Failed: ${data.results?.failed || 0} events`);
    } else {
      console.log(`[${timestamp}] ⚠️  Sync completed with warnings`);
      console.log(`   - Result:`, data);
    }
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Sync error:`, error.message);
  }
}

// Run immediately on start
console.log('🚀 Google Calendar Sync Worker Started!');
console.log('📅 Running every 5 minutes...');
console.log('⏹️  Press Ctrl+C to stop\n');

triggerSync();

// Run every 5 minutes (300000 milliseconds)
setInterval(triggerSync, 5 * 60 * 1000);
