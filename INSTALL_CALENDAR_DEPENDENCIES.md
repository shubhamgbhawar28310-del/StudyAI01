# Install Interactive Calendar Dependencies

## Step 1: Install npm packages

Run this command in your project root:

```bash
npm install react-big-calendar date-fns
```

## Step 2: Install TypeScript types (if using TypeScript)

```bash
npm install --save-dev @types/react-big-calendar
```

## Step 3: Verify Installation

Check your `package.json` to ensure these are added:

```json
{
  "dependencies": {
    "react-big-calendar": "^1.8.5",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react-big-calendar": "^1.8.5"
  }
}
```

## Step 4: Import Styles

The calendar CSS will be imported in the component, but you can also add it globally in your main CSS file:

```css
@import 'react-big-calendar/lib/css/react-big-calendar.css';
```

## What These Libraries Do

### react-big-calendar
- Full-featured calendar component
- Supports drag & drop
- Multiple view modes (day, week, month, agenda)
- Event resizing
- Customizable styling
- Accessibility support

### date-fns
- Modern date utility library
- Lightweight (tree-shakeable)
- Immutable & pure functions
- Better TypeScript support than moment.js
- Used by react-big-calendar for date operations

## Next Steps

After installation:
1. ✅ Dependencies installed
2. 📝 Create InteractiveCalendar.tsx component
3. 🎨 Add custom styles
4. 🔧 Update ScheduleView.tsx
5. 🧪 Test the new calendar

Run the install command now, then I'll provide the component code!
