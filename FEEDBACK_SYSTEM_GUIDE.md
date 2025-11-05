# 📝 Feedback System Setup Guide

## Overview
Your StudyAI app now has a complete feedback system where users can submit bugs, suggestions, and general feedback. All submissions are saved to Supabase and you can view them in an admin panel.

## 🗄️ Database Setup

### Step 1: Run the Migration
Run this SQL in your Supabase SQL Editor:

```bash
# The migration file is located at:
supabase/migrations/FEEDBACK_SYSTEM_SETUP.sql
```

This creates:
- `user_feedback` table to store all feedback
- Indexes for fast queries
- Row Level Security policies
- Automatic timestamp updates

### Table Structure
```sql
user_feedback:
  - id (UUID, primary key)
  - user_id (UUID, references auth.users) - can be null for anonymous feedback
  - feedback_type (TEXT: 'bug', 'suggestion', 'general')
  - message (TEXT)
  - email (TEXT, optional)
  - status (TEXT: 'new', 'reviewed', 'resolved', 'archived')
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

## 📊 How to View Feedback

### Option 1: Directly in Supabase Dashboard
1. Go to your Supabase project
2. Click "Table Editor" in the sidebar
3. Select the `user_feedback` table
4. You'll see all feedback submissions with:
   - Feedback type (bug/suggestion/general)
   - Message content
   - User email (if provided)
   - Status
   - Timestamps

### Option 2: Use the FeedbackViewer Component (Recommended)

Add the FeedbackViewer to your Dashboard as a new tab:

1. **Import the component** in `src/pages/Dashboard.tsx`:
```typescript
import { FeedbackViewer } from '@/components/features/FeedbackViewer'
```

2. **Add a case in renderContent()**:
```typescript
case 'feedback-viewer':
  return <FeedbackViewer />
```

3. **Add to sidebar** in `src/components/ModernSidebar.tsx`:
```typescript
const mainTools = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'feedback-viewer', label: 'Feedback', icon: MessageSquare }, // Add this
  // ... other tools
]
```

The FeedbackViewer provides:
- 📊 Statistics dashboard (total, by type, by status)
- 🔍 Filter by feedback type
- ✅ Mark feedback as reviewed/resolved/archived
- 📧 View user emails for follow-ups
- 📅 See submission timestamps
- 🔄 Refresh button

## 🎯 Features

### For Users:
- ✨ Beautiful, friendly feedback modal
- 🐞 Report bugs
- 💡 Suggest features
- ✨ Share general feedback
- 📧 Optional email for follow-ups
- 💙 Warm, founder-led tone

### For You (Admin):
- 📊 View all feedback in one place
- 🏷️ Filter by type (bug/suggestion/general)
- ✅ Track status (new/reviewed/resolved/archived)
- 📧 See user contact info
- 📈 View statistics
- 🔄 Update feedback status

## 🔐 Security

The system includes Row Level Security (RLS):
- Users can only view their own feedback
- Users can submit feedback (even anonymously)
- Admin queries require proper authentication
- All data is encrypted at rest

## 📝 Usage Examples

### Submit Feedback (Already Working)
Users click the floating feedback button (bottom-right) and fill out the form.

### Query Feedback Programmatically
```typescript
import { getAllFeedback, getFeedbackStats } from '@/services/feedbackService'

// Get all feedback
const feedback = await getAllFeedback()

// Get statistics
const stats = await getFeedbackStats()
console.log(`Total feedback: ${stats.total}`)
console.log(`Bugs: ${stats.byType.bug}`)
console.log(`New items: ${stats.byStatus.new}`)
```

### Update Feedback Status
```typescript
import { updateFeedbackStatus } from '@/services/feedbackService'

await updateFeedbackStatus(feedbackId, 'resolved')
```

## 🎨 Customization

### Change Feedback Types
Edit `feedbackTypes` array in `src/components/modals/FeedbackModal.tsx`

### Add More Status Options
Update the CHECK constraint in the migration and add to `statusConfig` in FeedbackViewer

### Email Notifications
You can set up Supabase Edge Functions to send you email notifications when new feedback arrives:

```typescript
// supabase/functions/notify-feedback/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Send email notification
  // Use SendGrid, Resend, or your preferred email service
})
```

## 📧 Export Feedback

To export all feedback as CSV:

```sql
-- Run in Supabase SQL Editor
COPY (
  SELECT 
    feedback_type,
    message,
    email,
    status,
    created_at
  FROM user_feedback
  ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;
```

## 🚀 Next Steps

1. ✅ Run the migration in Supabase
2. ✅ Test submitting feedback
3. ✅ View feedback in Supabase dashboard
4. 📊 (Optional) Add FeedbackViewer to your dashboard
5. 📧 (Optional) Set up email notifications
6. 🎯 Start improving StudyAI based on user feedback!

## 💡 Tips

- Check feedback regularly to catch bugs early
- Respond to users who leave emails
- Use the status system to track progress
- Export feedback monthly for analysis
- Share resolved suggestions with users to show you're listening

---

**Your feedback is now being saved! Every message from users is stored in Supabase and ready for you to review.** 💙
