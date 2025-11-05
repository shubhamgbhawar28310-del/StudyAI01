# Aivy Logo - Golden Ratio Design Guide

## Design Specifications

### Golden Ratio Proportions
- **Logomark Height**: 100 units (base measurement)
- **Logotype Height**: 61.8 units (61.8% of logomark - golden ratio)
- **Spacing**: 25 units (25% of logomark height)
- **Aspect Ratio**: 1:3 (horizontal layout)
- **Baseline**: Aligned at bottom edge

### Visual Elements
- **Logomark**: Stylized geometric "A" with accent dot
- **Gradient**: Blue (#2563eb) → Purple (#9333ea)
- **Logotype**: Modern geometric sans-serif "Aivy"
- **Background**: Transparent
- **Format**: Scalable SVG

## Usage

### 1. Import the Component

```tsx
import { AivyLogo, AivyLogoCompact } from '@/components/branding/AivyLogo';
```

### 2. Use in Components

#### Full Logo (Header, Footer)
```tsx
<AivyLogo height={40} className="text-gray-900 dark:text-white" />
```

#### Compact Logo (Sidebars, Mobile)
```tsx
<AivyLogoCompact height={32} />
```

## Implementation Examples

### Landing Page Header
```tsx
<a href="/" className="flex items-center hover:opacity-80 transition-opacity">
  <AivyLogo height={38} className="text-gray-900 dark:text-white" />
</a>
```

### Footer
```tsx
<div className="flex items-center mb-4">
  <AivyLogo height={38} className="text-white" />
</div>
```

### Sidebar
```tsx
<div className="flex items-center gap-3">
  <AivyLogoCompact height={32} />
  {!isCollapsed && (
    <span className="text-xl font-bold">Aivy</span>
  )}
</div>
```

## Advantages of SVG Logo

✅ **Scalable** - Perfect at any size, no pixelation
✅ **Lightweight** - Smaller file size than PNG
✅ **Customizable** - Text color adapts to theme (dark/light)
✅ **Golden Ratio** - Mathematically balanced proportions
✅ **Gradient** - Built-in blue→purple gradient on logomark
✅ **Accessible** - Semantic SVG with proper structure

## Color Variants

### Default (with gradient logomark)
```tsx
<AivyLogo height={40} className="text-gray-900" />
```

### Dark Mode
```tsx
<AivyLogo height={40} className="text-white" />
```

### Custom Color
```tsx
<AivyLogo height={40} className="text-blue-600" />
```

## Sizing Guide

| Context | Height | Component |
|---------|--------|-----------|
| Header | 38-40px | `AivyLogo` |
| Footer | 38-40px | `AivyLogo` |
| Sidebar | 32px | `AivyLogoCompact` |
| Mobile | 28-32px | `AivyLogoCompact` |
| Favicon | 16-24px | `AivyLogoCompact` |

## Migration from PNG

### Before (PNG)
```tsx
<img src="/aivyapp1.png" alt="Aivy Logo" className="h-[38px] w-[38px]" />
<span className="text-[24px] font-bold">Aivy</span>
```

### After (SVG)
```tsx
<AivyLogo height={38} className="text-gray-900 dark:text-white" />
```

## Customization

You can customize the logo by:
1. Adjusting the `height` prop
2. Changing text color via `className`
3. Modifying gradient colors in the SVG defs
4. Adjusting spacing and proportions in the component

## Technical Details

- **Format**: React/TypeScript component
- **Rendering**: Inline SVG
- **Performance**: No HTTP request, instant render
- **Accessibility**: Semantic markup
- **Responsive**: Scales perfectly on all devices
- **Theme-aware**: Adapts to dark/light mode

## Next Steps

1. Replace PNG logos with SVG component
2. Test on all pages (landing, dashboard, sidebars)
3. Verify dark mode appearance
4. Check mobile responsiveness
5. Update favicon if needed
