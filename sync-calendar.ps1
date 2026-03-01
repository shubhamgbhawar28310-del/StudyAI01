# Quick Sync Script for Google Calendar
# Run this to manually sync Study Planner events to Google Calendar

Write-Host "🔄 Syncing Study Planner to Google Calendar..." -ForegroundColor Cyan

$response = Invoke-RestMethod `
  -Uri "https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer your-supabase-anon-key-here"
    "Content-Type" = "application/json"
  }

Write-Host ""
Write-Host "✅ Sync Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  Processed: $($response.results.processed)" -ForegroundColor White
Write-Host "  Failed: $($response.results.failed)" -ForegroundColor White

if ($response.results.errors.Count -gt 0) {
  Write-Host ""
  Write-Host "Errors:" -ForegroundColor Red
  foreach ($error in $response.results.errors) {
    Write-Host "  - $error" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Check your Google Calendar now! 📅" -ForegroundColor Cyan
