# 🚀 START HERE - Interactive Calendar Setup

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies (2 minutes)

Open your terminal and run:

```bash
npm install react-big-calendar date-fns
npm install --save-dev @types/react-big-calendar
```

Wait for installation to complete.

### Step 2: Update ScheduleView.tsx (5 minutes)

Open `src/components/features/ScheduleView.tsx` and replace its content with:

```typescript
import { InteractiveCalendar } from './InteractiveCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { useState } from 'react';
import { ScheduleEventModal } from '@/components/modals/ScheduleEventModal';

interface ScheduleViewProps {
  compactMode?: boolean;
  showHeader?: boolean;
}

export function ScheduleView({ compactMode = false, showHeader = true }: ScheduleViewProps) {
  const [showEventModal, setShowEventModal] = useState(false);

  return (
    <div className="space-y-4">
      {showHeader && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Study Planner
              </CardTitle>
              <Button
                onClick={() => setShowEventModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <InteractiveCalendar />
        </CardContent>
      </Card>

      <ScheduleEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />
    </div>
  );
}

// Export for backward compatibility
export { ScheduleView as DynamicScheduleView };
```

Save the file.

### Step 3: Test! (2 minutes)

```bash
npm run dev
```

Navigate to your Study Planner page and test:

1. ✅ **Click** an empty time slot → Modal opens → Create event
2. ✅ **Drag** an event to a new time → Event moves
3. ✅ **Resize** an event (drag edges) → Duration changes
4. ✅ **Double-click** an event → Edit modal opens

---

## 🎉 That's It!

You now have a fully functional Google Calendar-style interactive planner!

## 📋 What You Can Do Now

### Create Events
- **Click** any time slot
- **Drag** across multiple slots to select duration
- Fill in details and save

### Move Events
- **Click and drag** any event
- Drop it on a new time or day
- Changes save automatically

### Resize Events
- **Hover** over event edges
- **Drag** up or down to change duration
- Release to save

### Edit Events
- **Double-click** any event
- Modify details
- Save changes

---

## 🎨 What's Included (Phase 1)

✅ Interactive time grid
✅ Click to create
✅ Drag to move
✅ Resize to change duration
✅ Week view (7 days)
✅ Color-coded by type
✅ Auto-save to Supabase
✅ Current time indicator
✅ Today highlighting
✅ Responsive design

---

## 🔜 Coming Next (Phase 2)

When you're ready for more features:

- 🎨 Custom toolbar with better navigation
- 🌓 Dark mode support
- 📅 Multiple views (Day/Month/Agenda)
- 🎯 Custom event cards with icons
- 📱 Enhanced mobile experience

Just let me know and I'll create Phase 2!

---

## 🐛 Troubleshooting

### Calendar not showing?
```bash
# Reinstall dependencies
npm install react-big-calendar date-fns --force

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Events not saving?
- Check browser console for errors
- Verify `.env` has correct Supabase credentials
- Run `DISABLE_TRIGGER_TEMPORARILY.sql` if duplicate errors

### Drag/drop not working?
- Make sure you're clicking and holding
- Check if `calendar.css` is loaded
- Verify no JavaScript errors

---

## 📚 Documentation

For more details, see:
- `PHASE_1_COMPLETE_SUMMARY.md` - Full Phase 1 guide
- `ALL_PHASES_ROADMAP.md` - Complete roadmap
- `INTERACTIVE_CALENDAR_IMPLEMENTATION.md` - Technical details

---

## ✅ Checklist

- [ ] Dependencies installed
- [ ] ScheduleView.tsx updated
- [ ] Dev server running
- [ ] Calendar displays
- [ ] Can create events
- [ ] Can drag events
- [ ] Can resize events
- [ ] Changes save to database

---

**Ready to go? Run the commands above and enjoy your new interactive calendar! 🎉**

Need help? Check the troubleshooting section or review the detailed guides.
