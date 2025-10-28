# Visual Formatting Guide - AI Assistant Messages

## 📐 Spacing & Alignment Reference

### **Line Heights (Leading)**
```
User Messages:     leading-7  (1.75)
AI Paragraphs:     leading-7  (1.75)
AI Lists:          leading-7  (1.75)
Code Blocks:       leading-6  (1.5)
Headings:          leading-tight (1.3)
```

### **Vertical Spacing (Margins)**
```
Paragraphs:        my-3  (0.75rem top/bottom)
Headings H1:       mt-6 mb-4 first:mt-0
Headings H2:       mt-5 mb-3 first:mt-0
Headings H3:       mt-4 mb-2 first:mt-0
Headings H4:       mt-3 mb-2
Lists (ul/ol):     my-3  (0.75rem top/bottom)
List Items:        space-y-1.5 (0.375rem between)
Code Blocks:       my-4  (1rem top/bottom)
Tables:            my-4  (1rem top/bottom)
Blockquotes:       my-3  (0.75rem top/bottom)
```

### **Horizontal Spacing (Padding/Margins)**
```
Message Container: px-4  (1rem left/right)
Max Width:         max-w-4xl mx-auto
Avatar Gap:        gap-4  (1rem)
List Indentation:  ml-5  (1.25rem)
List Item Padding: pl-1  (0.25rem)
Code Block:        p-4   (1rem all sides)
Table Cells:       px-4 py-2 (1rem horizontal, 0.5rem vertical)
Blockquote:        pl-4  (1rem left)
```

---

## 🎨 Visual Examples

### **Example 1: Heading Hierarchy**
```markdown
# Main Topic (H1)
← 2px bottom border, 1.5rem font, 1rem bottom margin

## Subtopic (H2)
← 1px bottom border, 1.25rem font, 0.75rem bottom margin

### Detail (H3)
← No border, 1.1rem font, 0.5rem bottom margin

#### Note (H4)
← No border, 1rem font, 0.5rem bottom margin
```

**Visual Result:**
```
═══════════════════════════════════
# Main Topic
═══════════════════════════════════
                                    ← 1rem space
─────────────────────────────────── 
## Subtopic
───────────────────────────────────
                                    ← 0.75rem space
### Detail
                                    ← 0.5rem space
#### Note
```

---

### **Example 2: List Formatting**
```markdown
- First item
- Second item
  - Nested item A
  - Nested item B
- Third item
```

**Visual Result:**
```
     • First item                   ← ml-5 (bullets outside)
     • Second item
         • Nested item A            ← Additional indentation
         • Nested item B
     • Third item
```

**Spacing:**
- Between items: `0.375rem` (space-y-1.5)
- Line height: `1.75` (leading-7)
- Left margin: `1.25rem` (ml-5)
- Item padding: `0.25rem` (pl-1)

---

### **Example 3: Code Block**
```
╔═══════════════════════════════════╗
║ PYTHON                    [Copy]  ║ ← Header (py-2.5)
╠═══════════════════════════════════╣
║                                   ║
║  def hello():                     ║ ← Code (p-4)
║      print("Hello, World!")       ║
║                                   ║
╚═══════════════════════════════════╝
```

**Structure:**
- Outer border: `border border-border`
- Header background: `bg-muted/50`
- Code background: `bg-muted/30`
- Language label: `text-xs font-semibold uppercase tracking-wide`
- Code font: `font-mono leading-6`

---

### **Example 4: Paragraph Spacing**
```
This is paragraph one with proper spacing.
                                           ← 0.75rem space (my-3)
This is paragraph two with consistent line height.
                                           ← 0.75rem space
This is paragraph three.
```

**Line Height:**
- Each line within paragraph: `1.75` (leading-7)
- Space between paragraphs: `0.75rem` (my-3)

---

### **Example 5: Table Layout**
```
╔═══════════════╦═══════════════╗
║ Header 1      ║ Header 2      ║ ← bg-muted, font-semibold
╠═══════════════╬═══════════════╣
║ Cell 1        ║ Cell 2        ║ ← Regular row
╠═══════════════╬═══════════════╣
║ Cell 3        ║ Cell 4        ║ ← Striped (bg-muted/30)
╚═══════════════╩═══════════════╝
```

**Cell Padding:**
- Horizontal: `1rem` (px-4)
- Vertical: `0.625rem` (py-2.5)
- Font size: `0.875rem` (text-sm)

---

### **Example 6: Blockquote**
```
┃  This is a blockquote with proper styling.
┃  It has a left border and italic text.
┃  Multiple lines are supported.
```

**Styling:**
- Left border: `4px solid primary/50`
- Padding: `pl-4 py-2`
- Text: `italic text-muted-foreground`
- Margin: `my-3`

---

## 🔤 Typography Scale

### **Font Sizes**
```
H1:           1.5rem   (24px)
H2:           1.25rem  (20px)
H3:           1.1rem   (17.6px)
H4:           1rem     (16px)
Body:         0.875rem (14px) - prose-sm
Code:         0.875rem (14px)
Table:        0.875rem (14px)
Inline Code:  0.875em  (relative to parent)
```

### **Font Weights**
```
Headings:     600 (font-semibold)
Strong/Bold:  600 (font-semibold)
Regular:      400 (font-normal)
Code Label:   600 (font-semibold)
```

---

## 📏 Measurement Reference

### **Tailwind Spacing Scale**
```
0.5  = 0.125rem = 2px
1    = 0.25rem  = 4px
1.5  = 0.375rem = 6px
2    = 0.5rem   = 8px
2.5  = 0.625rem = 10px
3    = 0.75rem  = 12px
4    = 1rem     = 16px
5    = 1.25rem  = 20px
6    = 1.5rem   = 24px
```

### **Line Height Scale**
```
leading-6     = 1.5
leading-7     = 1.75
leading-tight = 1.25
leading-relaxed = 1.625
```

---

## 🎯 Alignment Rules

### **Text Alignment**
```
All text:          Left-aligned
Table headers:     Left-aligned (text-left)
Table cells:       Left-aligned (text-left)
Code:              Left-aligned
Lists:             Left-aligned with proper indentation
```

### **Container Alignment**
```
Message container: max-w-4xl mx-auto (centered with max width)
Avatar:            flex-shrink-0 (fixed width)
Content:           flex-1 min-w-0 (flexible, can shrink)
```

---

## 🎨 Color Usage

### **Text Colors**
```
Body text:         text-foreground
Muted text:        text-muted-foreground
Code label:        text-muted-foreground
Links:             Default prose styling
```

### **Background Colors**
```
Code block outer:  bg-muted/20
Code block inner:  bg-muted/30
Code header:       bg-muted/50
Inline code:       bg-muted
Table header:      bg-muted
Table stripe:      bg-muted/30
```

### **Border Colors**
```
All borders:       border-border
Heading borders:   border-border
Blockquote:        border-blue-500 (or primary)
```

---

## ✅ Consistency Checklist

### **Spacing Consistency**
- [ ] All paragraphs use `my-3`
- [ ] All headings have proper `mt-*` and `mb-*`
- [ ] First heading has `first:mt-0`
- [ ] Lists use `ml-5` for indentation
- [ ] Code blocks use `my-4`

### **Typography Consistency**
- [ ] All text uses `leading-7` except code
- [ ] Code uses `leading-6`
- [ ] Headings use `leading-tight`
- [ ] Font sizes follow hierarchy

### **Color Consistency**
- [ ] Text uses `text-foreground`
- [ ] Muted elements use `text-muted-foreground`
- [ ] Backgrounds use theme variables
- [ ] Borders use `border-border`

### **Interactive Elements**
- [ ] Copy button on user messages (hover)
- [ ] Copy button on AI messages (always visible)
- [ ] Regenerate button on AI messages
- [ ] Code block copy button

---

## 🚀 Quick Reference Card

```
┌─────────────────────────────────────────┐
│  SPACING QUICK REFERENCE                │
├─────────────────────────────────────────┤
│  Paragraph spacing:        my-3         │
│  List spacing:             my-3         │
│  List indentation:         ml-5         │
│  Code block spacing:       my-4         │
│  Line height (text):       leading-7    │
│  Line height (code):       leading-6    │
│  Heading H1:               mt-6 mb-4    │
│  Heading H2:               mt-5 mb-3    │
│  Heading H3:               mt-4 mb-2    │
│  Max width:                max-w-4xl    │
│  Container padding:        px-4         │
└─────────────────────────────────────────┘
```

---

*Use this guide to maintain consistent formatting across all messages!*
