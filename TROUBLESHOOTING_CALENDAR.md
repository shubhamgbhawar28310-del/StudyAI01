# 🔧 Troubleshooting Interactive Calendar

## Issue: Calendar Not Working

If the calendar isn't showing or features aren't working, follow these steps:

### Step 1: Check Browser Console

1. Open your browser DevTools (F12)
2. Go to the Console tab
3. Look for any errors (red text)
4. Share the errors if you see any

### Step 2: Verify Dependencies

Run this command:
```bash
npm list react-big-calendar date-fns
```

You should see:
- `react-big-calendar@1.x.x`
- `date-fns@3.x.x` or `date-fns@4.x.x`

### Step 3: Clear Cache and Rebuild

```bash
# Stop the dev server (Ctrl+C)

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

### Step 4: Check if CSS is Loading

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for `calendar.css` in the list
5. If it's red (404), the CSS isn't loading

### Step 5: Manual CSS Import

If CSS isn't loading automatically, add this to your main CSS file (`src/index.css` or `src/App.css`):

```css
@import 'react-big-calendar/lib/css/react-big-calendar.css';
@import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
```

### Step 6: Check for Version Conflicts

You might have conflicting date-fns versions. Run:

```bash
npm list date-fns
```

If you see multiple versions, fix it:

```bash
npm install date-fns@latest --save
npm dedupe
```

### Step 7: Verify Imports

Make sure these files exist:
- `src/components/features/InteractiveCalendar.tsx` ✅
- `src/styles/calendar.css` ✅
- `src/components/features/ScheduleView.tsx` ✅

### Step 8: Test with Simple Calendar

Replace the content of `InteractiveCalendar.tsx` temporarily with this minimal version:

```typescript
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function InteractiveCalendar() {
  const events = [
    {
      title: 'Test Event',
      start: new Date(),
      end: new Date(Date.now() + 3600000),
    },
  ];

  return (
    <div style={{ height: '600px' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
      />
    </div>
  );
}
```

If this works, the issue is with the full implementation. If it doesn't, there's a dependency problem.

### Step 9: Check Vite/Webpack Config

If using Vite, make sure CSS imports are allowed. Add to `vite.config.ts`:

```typescript
export default defineConfig({
  css: {
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  }
});
```

### Step 10: Reinstall Specific Versions

Try installing specific compatible versions:

```bash
npm uninstall react-big-calendar date-fns
npm install react-big-calendar@1.8.5 date-fns@2.30.0
```

## Common Errors and Solutions

### Error: "Cannot find module 'react-big-calendar'"
**Solution**: Install the package
```bash
npm install react-big-calendar
```

### Error: "localizer is undefined"
**Solution**: Check date-fns import
```typescript
// Try this import style
import enUS from 'date-fns/locale/en-US';
// Instead of
import { enUS } from 'date-fns/locale';
```

### Error: "Calendar is not a function"
**Solution**: Check import statement
```typescript
import { Calendar } from 'react-big-calendar';
// Not
import Calendar from 'react-big-calendar';
```

### Calendar shows but is blank
**Solution**: 
1. Check if events array is populated
2. Verify date formats are correct
3. Check CSS is loaded

### Drag and drop doesn't work
**Solution**:
1. Make sure you're using `DnDCalendar` not `Calendar`
2. Import drag-and-drop CSS
3. Check `draggableAccessor` is set

### Events don't save
**Solution**:
1. Check browser console for errors
2. Verify Supabase connection
3. Check if `scheduleEventService` is working
4. Run `DISABLE_TRIGGER_TEMPORARILY.sql` if duplicate errors

## Debug Checklist

- [ ] Dependencies installed
- [ ] No console errors
- [ ] CSS files loading
- [ ] Events array has data
- [ ] Modal opens when clicking
- [ ] Supabase connection works
- [ ] No TypeScript errors

## Still Not Working?

### Collect This Information:

1. **Browser Console Errors** (screenshot or copy text)
2. **Network Tab** (any failed requests?)
3. **npm list output** (dependency versions)
4. **What happens when you click?** (nothing? error? modal?)
5. **Can you see the calendar grid?** (yes/no)
6. **Are existing events showing?** (yes/no)

### Quick Test Commands:

```bash
# Check if files exist
ls src/components/features/InteractiveCalendar.tsx
ls src/styles/calendar.css

# Check dependencies
npm list react-big-calendar date-fns

# Check for TypeScript errors
npx tsc --noEmit

# Restart dev server
npm run dev
```

## Alternative: Use Old Calendar Temporarily

If you need the calendar working NOW while we debug, you can temporarily revert to the old calendar by commenting out the InteractiveCalendar in ScheduleView.tsx.

---

**After trying these steps, let me know:**
1. What errors you see in console
2. Which step fixed it (or didn't)
3. Any other symptoms

I'll help you get it working! 🚀
