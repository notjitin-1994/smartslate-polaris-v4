# Layout Components

This directory contains the header and sidebar components integrated from the external SmartSlate repository, adapted for use with Next.js and the current project structure.

## Components Overview

### AppLayout

The main layout wrapper that combines both header and sidebar functionality.

```tsx
import { AppLayout } from '@/components/layout';

<AppLayout headerTitle="Page Title" headerSubtitle="Page description">
  {/* Page content */}
</AppLayout>;
```

### Header

Contextual header component that adapts to the current page.

```tsx
import { Header } from '@/components/layout';

<Header title="Custom Title" subtitle="Custom subtitle" />;
```

### Sidebar

Collapsible navigation sidebar with user profile and navigation sections.

```tsx
import { Sidebar } from '@/components/layout';

<Sidebar />;
```

### Navigation Components

#### NavSection

Creates collapsible navigation sections with support for tagged items.

```tsx
import { NavSection } from '@/components/layout';

const items = [
  'Simple Item',
  {
    label: 'Tagged Item',
    tagText: 'New',
    tagTone: 'preview',
  },
];

<NavSection title="Section Title" items={items} defaultOpen={true} onItemClick={handleItemClick} />;
```

#### Brand

Logo component that links to the dashboard.

```tsx
import { Brand } from '@/components/layout';

<Brand />;
```

#### UserAvatar

User avatar component with fallback to initials.

```tsx
import { UserAvatar } from '@/components/layout';

<UserAvatar user={user} sizeClass="w-8 h-8" textClass="text-sm font-semibold" />;
```

## Features

### Responsive Design

- **Desktop**: Full sidebar with collapsible functionality
- **Mobile**: Hidden sidebar with slide-out mobile menu

### Dark Mode Support

- All components support dark mode via Tailwind's `dark:` variants
- Consistent with the existing theme system

### Authentication Integration

- Components use the existing `AuthContext`
- User information is automatically displayed
- Logout functionality included

### Navigation State Management

- Sidebar collapse state persists in localStorage
- Recent explorations tracking
- Active route highlighting

### Animations

- Smooth transitions using Framer Motion
- Collapsible animations and hover effects
- Page enter animations

## Usage Examples

### Basic Page Layout

```tsx
// app/example/page.tsx
import { AppLayout } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ExamplePage() {
  return (
    <ProtectedRoute>
      <AppLayout
        headerTitle="Example Page"
        headerSubtitle="This is an example page with the new layout"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{/* Your page content */}</div>
      </AppLayout>
    </ProtectedRoute>
  );
}
```

### Custom Header Content

```tsx
import { Sidebar, Header } from '@/components/layout';

export default function CustomLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header title="Custom Title" subtitle="Custom description" />
        {children}
      </main>
    </div>
  );
}
```

## Customization

### Navigation Items

Update the navigation items in `Sidebar.tsx`:

```tsx
const learningItems: NavItem[] = [
  'Explore Learning',
  'My Learning',
  {
    label: 'Advanced Features',
    tagText: 'Beta',
    tagTone: 'preview',
  },
];
```

### Styling

Components use Tailwind classes and can be customized via:

- Tailwind configuration
- CSS custom properties for colors
- Component props for specific styling

### Icons

Icons are located in `icons.tsx` and can be easily extended:

```tsx
export const IconCustom = memo(function IconCustom({ className = '' }: IconProps) {
  return <svg className={className}>{/* SVG content */}</svg>;
});
```

## Integration Notes

### Root Layout Update

The root layout has been updated to include `AuthProvider`:

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>{children}</QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Authentication

Components automatically integrate with the existing auth system:

- User information from `useAuth()`
- Protected routes remain unchanged
- Logout functionality included

### Performance

- Components are memoized with `React.memo`
- Local storage operations are wrapped in try-catch
- Optimized for server-side rendering

## Migration Guide

To migrate existing pages to use the new layout:

1. **Remove existing headers/navigation** from page components
2. **Wrap page content** with `AppLayout`
3. **Update imports** to use layout components
4. **Remove duplicate auth providers** (now in root layout)

Before:

```tsx
export default function Page() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <header>Custom Header</header>
        <main>Content</main>
      </div>
    </AuthProvider>
  );
}
```

After:

```tsx
export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout headerTitle="Page Title">
        <div>Content</div>
      </AppLayout>
    </ProtectedRoute>
  );
}
```

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- ES6+ features (covered by Next.js transpilation)
- Tailwind CSS v4 compatible
