# Rebrand StudyAI to Aivy

## Quick Rebrand Script

Run this command to replace all occurrences:

```bash
# For Windows PowerShell
Get-ChildItem -Path src -Recurse -Include *.tsx,*.ts,*.jsx,*.js | ForEach-Object {
    (Get-Content $_.FullName) -replace 'StudyAI', 'Aivy' -replace 'studyai', 'aivy' -replace 'studyAI', 'aivy' | Set-Content $_.FullName
}

# For Linux/Mac
find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i 's/StudyAI/Aivy/g; s/studyai/aivy/g; s/studyAI/aivy/g' {} +
```

## Manual Changes Needed

### 1. Update Logo References
Replace the logo SVG with the image in these files:
- `src/components/landing/Header.tsx`
- `src/components/landing/Footer.tsx`
- `src/components/Slidebar.tsx`
- `src/components/ModernSidebar.tsx`

Change from SVG to:
```tsx
<img src="/aivyapp.png" alt="Aivy" className="h-8 w-8" />
```

### 2. Update Page Title
In `src/pages/LandingPage.tsx`:
```tsx
document.title = "Aivy - Your Notes. Your Plan. Your Success.";
```

### 3. Update AI Assistant System Instruction
In `src/services/aiService.ts` line 585:
```tsx
systemInstruction: "You are Aivy, an intelligent educational AI assistant..."
```

### 4. Update URLs in Privacy Policy
In `src/pages/PrivacyPolicy.tsx`:
- Change `studyai0.vercel.app` to your new domain
- Update all references from StudyAI to Aivy

### 5. Update Storage Keys (Optional but recommended)
- `studyai-theme` → `aivy-theme`
- `studyai-chat-sessions` → `aivy-chat-sessions`
- `studyAI-chatHistory` → `aivy-chatHistory`
- `StudyAI_FileStorage` → `Aivy_FileStorage`

## Files to Update

Key files with StudyAI references:
1. ✅ `src/components/landing/HeroSection.tsx` - Already updated
2. `src/components/landing/FeaturesSection.tsx`
3. `src/components/landing/Header.tsx` - Logo + name
4. `src/components/landing/Footer.tsx` - Logo + name + copyright
5. `src/components/landing/FaqSection.tsx`
6. `src/components/Slidebar.tsx` - Logo + name
7. `src/components/ModernSidebar.tsx` - Logo + name
8. `src/pages/Dashboard.tsx` - Welcome message
9. `src/pages/LandingPage.tsx` - Page title
10. `src/services/aiService.ts` - AI assistant identity
11. `src/services/googleCalendarService.ts` - Event descriptions
12. `src/pages/PrivacyPolicy.tsx` - All references

## After Rebranding

1. Clear browser cache
2. Test all pages
3. Verify AI assistant introduces itself as "Aivy"
4. Check Google Calendar event descriptions
5. Update any external documentation
