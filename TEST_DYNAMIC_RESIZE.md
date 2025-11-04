# Testing Dynamic Event Resize Feature

## Quick Start

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Navigate to the Schedule page**
   - The DynamicScheduleView component should load with the new resize functionality

3. **Test the features below**

## Test Scenarios

### ✅ Test 1: Visual Event Sizing
**Expected**: Events display with heights proportional to their duration

1. Create events with different durations:
   - 15 minutes → Should be ~20px tall (minimum)
   - 30 minutes → Should be ~40px tall (one slot)
   - 1 hour → Should be ~80px tall (two slots)
   - 2 hours → Should be ~160px tall (four slots)

2. Verify events align correctly with grid lines

### ✅ Test 2: Resize from Bottom Handle
**Expected**: Dragging bottom handle adjusts end time

1. Hover over an event
2. Resize handles should appear at top and bottom
3. Click and drag the **bottom** handle down
4. Event should grow in real-time
5. Release mouse
6. Event should snap to nearest 15-minute interval
7. Floating label should show new times during drag
8. Changes should save to database

### ✅ Test 3: Resize from Top Handle
**Expected**: Dragging top handle adjusts start time

1. Hover over an event
2. Click and drag the **top** handle up or down
3. Event should adjust start time in real-time
4. End time should remain fixed
5. Release mouse
6. Event should snap to nearest 15-minute interval
7. Changes should save to database

### ✅ Test 4: Minimum Duration Constraint
**Expected**: Cannot resize below 15 minutes

1. Create a 30-minute event
2. Try to resize it smaller by dragging bottom handle up
3. Should stop at 15 minutes minimum
4. Try to resize by dragging top handle down past end time
5. Should stop at 15 minutes before end time

### ✅ Test 5: 15-Minute Snapping
**Expected**: All resize operations snap to 15-minute intervals

1. Resize an event slowly
2. Notice it snaps to :00, :15, :30, :45 minute marks
3. Floating label should show snapped times
4. Final position should align with grid

### ✅ Test 6: Drag-to-Move (Existing Feature)
**Expected**: Moving events still works

1. Click and drag an event from its **center** (not handles)
2. Event should move to new time slot
3. Duration should be preserved
4. Should snap to 15-minute intervals
5. Changes should save to database

### ✅ Test 7: Drag-to-Create (Existing Feature)
**Expected**: Creating events by dragging still works

1. Click and drag on **empty** grid cells
2. Blue selection should appear
3. Floating label should show time range
4. Release mouse
5. Modal should open with pre-filled times
6. Times should be snapped to 15-minute intervals

### ✅ Test 8: Modal Interactions
**Expected**: All modal features still work

1. Click on an event → StudySessionModal should open
2. Click Edit button → ScheduleEventModal should open
3. Click Delete button → Confirmation dialog, then delete
4. Click "Add Event" button → ScheduleEventModal should open
5. All modals should function normally

### ✅ Test 9: Visual Feedback
**Expected**: Smooth animations and visual cues

1. **Hover State**:
   - Resize handles should fade in (200ms)
   - Event should get enhanced shadow

2. **Resizing State**:
   - Event should have blue shadow
   - Floating time label should appear
   - Height should update smoothly

3. **Dragging State**:
   - Event should become semi-transparent (0.7 opacity)
   - Event should scale slightly (1.02)

### ✅ Test 10: Theme Compatibility
**Expected**: Works in both light and dark modes

1. Test in light mode
2. Switch to dark mode
3. Verify colors, shadows, and visibility
4. All features should work identically

## 🐛 Common Issues & Solutions

### Issue: Events not showing
**Solution**: Check browser console for errors. Ensure CSS file is imported.

### Issue: Resize handles not appearing
**Solution**: Hover directly over event. Check CSS is loaded.

### Issue: Events not saving
**Solution**: Check Supabase connection. Check browser console for errors.

### Issue: Events overlapping
**Solution**: This is expected behavior. Events at the same time will overlap (like Google Calendar).

### Issue: Drag-to-create not working
**Solution**: Make sure you're clicking on empty grid cells, not on events.

## 📊 Performance Check

1. Create 20+ events in a single day
2. Resize multiple events
3. Check for smooth performance (should be 60fps)
4. Check browser console for errors or warnings

## ✨ Visual Inspection

### Event Appearance
- [ ] Events have rounded corners
- [ ] Events show title and start time
- [ ] Status indicator dot visible
- [ ] Edit/Delete buttons appear on hover
- [ ] Colors match event types (blue=task, green=study, yellow=break, purple=other)

### Resize Handles
- [ ] Handles appear on hover
- [ ] Handles have white indicator bars
- [ ] Cursor changes to ns-resize
- [ ] Handles are clickable

### Grid
- [ ] Hour marks have thicker borders
- [ ] Time labels show 12-hour format (AM/PM)
- [ ] Current time slot highlighted
- [ ] Grid cells clickable

## 🎯 Success Criteria

All tests should pass with:
- ✅ Smooth animations
- ✅ Accurate 15-minute snapping
- ✅ Correct time calculations
- ✅ Database persistence
- ✅ No console errors
- ✅ Responsive interactions
- ✅ Theme compatibility

## 📝 Report Issues

If you find any issues:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Note browser and OS version
4. Take screenshots if visual issue

## 🎉 Expected Result

A fully functional, Google Calendar-like event system with:
- Dynamic event sizing
- Smooth resize interactions
- Precise 15-minute snapping
- Beautiful visual feedback
- All existing features working
