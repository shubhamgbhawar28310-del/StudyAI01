# 🚀 Phase 1: Minimal Working MVP - Setup Instructions

## Step 1: Install Dependencies

Run this command in your terminal:

```bash
npm install react-big-calendar date-fns
npm install --save-dev @types/react-big-calendar
```

## Step 2: Files I'm Creating for You

1. ✅ `src/components/features/InteractiveCalendar.tsx` - Main calendar component
2. ✅ `src/styles/calendar.css` - Basic calendar styles
3. ✅ `src/components/modals/QuickEventModal.tsx` - Quick event creation
4. ✅ Updated `src/components/features/ScheduleView.tsx` - Integration wrapper

## Step 3: What You'll Get

### Features Included in Phase 1:
- ✅ **Click to create** - Click any time slot to create an event
- ✅ **Drag to create** - Drag across time slots to select duration
- ✅ **Drag to move** - Drag events to new times/days
- ✅ **Resize events** - Drag edges to change duration
- ✅ **Week view** - 7-day week view (default)
- ✅ **Supabase integration** - All CRUD operations
- ✅ **Auto-save** - Changes save immediately
- ✅ **Event colors** - Color-coded by type
- ✅ **Existing UI** - Keeps your sidebar, header, buttons

### Not Included Yet (Coming in Phase 2):
- ❌ Custom toolbar (using default for now)
- ❌ Dark mode (light theme only)
- ❌ Multiple view toggle (week only)
- ❌ Custom event styling (basic for now)

## Step 4: Testing Checklist

After I create the files, test these:

1. **Create Event**
   - Click empty time slot
   - Modal should open
   - Fill in details
   - Click save
   - Event should appear

2. **Drag Event**
   - Click and hold event
   - Drag to new time
   - Release
   - Event should move and save

3. **Resize Event**
   - Hover over event edge
   - Cursor should change
   - Drag edge up/down
   - Event should resize and save

4. **Edit Event**
   - Double-click event
   - Modal should open with data
   - Change details
   - Save
   - Event should update

5. **Delete Event**
   - Open event modal
   - Click delete
   - Confirm
   - Event should disappear

## Step 5: Troubleshooting

### If calendar doesn't show:
```bash
# Verify dependencies installed
npm list react-big-calendar date-fns

# Reinstall if needed
npm install react-big-calendar date-fns --force
```

### If events don't save:
- Check browser console for errors
- Verify Supabase connection
- Check `schedule_events` table exists
- Run `DISABLE_TRIGGER_TEMPORARILY.sql` if duplicate errors

### If drag/drop doesn't work:
- Make sure you're clicking and holding
- Check if event has `draggable` property
- Verify no CSS conflicts

## Step 6: Next Steps

Once Phase 1 is working:
1. ✅ Test all features thoroughly
2. ✅ Report any bugs
3. ✅ Ready for Phase 2 (Custom toolbar, dark mode, views)

---

**Ready to proceed?** I'll create all the files now! 🚀
