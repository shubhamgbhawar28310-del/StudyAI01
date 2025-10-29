# 📋 Copy Components Guide - Preserve Exact UI

## ⚠️ IMPORTANT: I need to copy the EXACT UI from the landing page project

The landing page project has all the components with the video and exact design. I need to copy them to the main website.

## Quick Solution - Copy All Components

### Step 1: Copy All Landing Components

Run these commands in PowerShell (from the main website folder):

```powershell
# Create landing folder
New-Item -ItemType Directory -Force -Path "src\components\landing"

# Copy all components from landing page project
Copy-Item "study-flow-ai-40-main\src\components\Header.tsx" "src\components\landing\Header.tsx"
Copy-Item "study-flow-ai-40-main\src\components\HeroSection.tsx" "src\components\landing\HeroSection.tsx"
Copy-Item "study-flow-ai-40-main\src\components\FeaturesSection.tsx" "src\components\landing\FeaturesSection.tsx"
Copy-Item "study-flow-ai-40-main\src\components\CtaSection.tsx" "src\components\landing\CtaSection.tsx"
Copy-Item "study-flow-ai-40-main\src\components\FaqSection.tsx" "src\components\landing\FaqSection.tsx"
Copy-Item "study-flow-ai-40-main\src\components\Footer.tsx" "src\components\landing\Footer.tsx"
Copy-Item "study-flow-ai-40-main\src\components\FeatureCarousel.tsx" "src\components\landing\FeatureCarousel.tsx"
```

### Step 2: Update Imports in Copied Components

After copying, you need to update ONE import in each file:

**Change this:**
```typescript
import { supabase } from "@/integrations/supabase/client";
```

**To this:**
```typescript
import { supabase } from "@/lib/supabase";
```

**Files to update:**
- `src/components/landing/Header.tsx` (line 5)

That's the ONLY change needed! Everything else stays exactly the same.

### Step 3: Copy the Login and Signup Pages

The Login and Signup pages also need the EXACT UI from the landing project:

```powershell
# Backup current files (optional)
Copy-Item "src\pages\Login.tsx" "src\pages\Login.tsx.backup"
Copy-Item "src\pages\Signup.tsx" "src\pages\Signup.tsx.backup"

# Copy from landing project
Copy-Item "study-flow-ai-40-main\src\pages\Login.tsx" "src\pages\Login.tsx"
Copy-Item "study-flow-ai-40-main\src\pages\Signup.tsx" "src\pages\Signup.tsx"
```

### Step 4: Update Login.tsx and Signup.tsx

After copying, update these files:

**In `src/pages/Login.tsx`:**

1. Change line 4:
```typescript
// FROM:
import { supabase } from "@/integrations/supabase/client";
// TO:
import { supabase } from "@/lib/supabase";
```

2. Change line 28-29 (redirect URL):
```typescript
// FROM:
window.location.href = "http://localhost:5173/";
// TO:
navigate('/dashboard', { replace: true });
```

3. Change line 76 (Google OAuth redirect):
```typescript
// FROM:
redirectTo: 'http://localhost:5173/'
// TO:
redirectTo: window.location.origin + '/dashboard'
```

4. Remove line 7 (SupabaseDebug import) - we don't need it
5. Remove line 87 (`<SupabaseDebug />`) - we don't need it

**In `src/pages/Signup.tsx`:**

1. Change line 4:
```typescript
// FROM:
import { supabase } from "@/integrations/supabase/client";
// TO:
import { supabase } from "@/lib/supabase";
```

2. Change line 29 (redirect URL):
```typescript
// FROM:
window.location.href = "http://localhost:5173/";
// TO:
navigate('/dashboard', { replace: true });
```

3. Change line 56 and 93 (email redirect and Google OAuth):
```typescript
// FROM:
emailRedirectTo: 'http://localhost:5173/',
redirectTo: 'http://localhost:5173/'
// TO:
emailRedirectTo: window.location.origin + '/dashboard',
redirectTo: window.location.origin + '/dashboard'
```

4. Remove line 7 (SupabaseDebug import)
5. Remove line 98 (`<SupabaseDebug />`)

### Step 5: Copy the FeatureCarousel Component

The Login and Signup pages use FeatureCarousel:

```powershell
Copy-Item "study-flow-ai-40-main\src\components\FeatureCarousel.tsx" "src\components\landing\FeatureCarousel.tsx"
```

Then update imports in Login.tsx and Signup.tsx:
```typescript
// Change:
import { FeatureCarousel } from "@/components/FeatureCarousel";
// To:
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
```

## Alternative: Manual Copy

If PowerShell commands don't work, manually:

1. Open `study-flow-ai-40-main\src\components\Header.tsx`
2. Copy ALL the content
3. Create `src\components\landing\Header.tsx` in main website
4. Paste the content
5. Change the supabase import (line 5)
6. Repeat for all other components

## What This Preserves

✅ **Exact same UI** - No changes to HTML/CSS/layout  
✅ **Video in hero section** - Preserved exactly  
✅ **All animations** - Preserved exactly  
✅ **All styling** - Preserved exactly  
✅ **FeatureCarousel** - Preserved exactly  

## After Copying

1. Restart the dev server: `npm run dev`
2. Visit http://localhost:5173
3. You should see the EXACT landing page UI
4. Login/Signup should have the EXACT UI with FeatureCarousel

## Files That Should Exist After Copying

```
src/
├── components/
│   └── landing/
│       ├── Header.tsx ✅
│       ├── HeroSection.tsx ✅
│       ├── FeaturesSection.tsx ✅
│       ├── CtaSection.tsx ✅
│       ├── FaqSection.tsx ✅
│       ├── Footer.tsx ✅
│       └── FeatureCarousel.tsx ✅
├── pages/
│   ├── LandingPage.tsx ✅ (already created)
│   ├── Login.tsx ✅ (needs updating)
│   └── Signup.tsx ✅ (needs updating)
```

## Summary

The key is to:
1. Copy ALL components from `study-flow-ai-40-main/src/components/` to `src/components/landing/`
2. Update ONLY the supabase import path
3. Update redirect URLs to use React Router navigate
4. Everything else stays EXACTLY the same!

This preserves the EXACT UI including the video, animations, and all styling! 🎨
