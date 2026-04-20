# Settings Page - Usage Examples & Code Patterns

## Component Usage Examples

### Basic Tab Integration

```tsx
// Import the main component
import { SettingsTabs } from '@/components/settings/SettingsTabs';

// Use in your page
export default function SettingsPage() {
  return (
    <div className="container">
      <h1>Settings</h1>
      <SettingsTabs />
    </div>
  );
}
```

### Direct Tab Navigation

```tsx
// Navigate to specific tab programmatically
import { useRouter } from 'next/navigation';

function MyComponent() {
  const router = useRouter();

  const goToAccountSettings = () => {
    router.push('/settings#account');
  };

  return (
    <button onClick={goToAccountSettings}>
      Manage Subscription
    </button>
  );
}
```

### Tab Persistence Example

```tsx
// Read active tab from URL
const hash = window.location.hash.replace('#', ''); // 'account'

// Read from localStorage
const savedTab = localStorage.getItem('settings-active-tab'); // 'preferences'

// Set active tab
window.location.hash = 'advanced';
localStorage.setItem('settings-active-tab', 'advanced');
```

## Custom Tab Content Pattern

If you need to add a new section to an existing tab:

```tsx
// In ProfileTab.tsx or any other tab
export function ProfileTab() {
  return (
    <div className="space-y-6">
      {/* Existing content */}
      <GlassCard className="p-6 sm:p-8">
        {/* ... */}
      </GlassCard>

      {/* Add your new section */}
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <YourIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-heading font-semibold text-foreground">
              Your Section Title
            </h3>
            <p className="text-caption text-text-secondary">
              Your description
            </p>
          </div>
        </div>

        {/* Your content here */}
      </GlassCard>
    </div>
  );
}
```

## Adding a New Tab

Complete example of adding a 5th tab:

### Step 1: Create Tab Component

```tsx
// /components/settings/tabs/IntegrationsTab.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plug } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export function IntegrationsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Plug className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-heading font-semibold text-foreground">
              Integrations
            </h3>
            <p className="text-caption text-text-secondary">
              Connect external services
            </p>
          </div>
        </div>

        {/* Your integration content */}
      </GlassCard>
    </motion.div>
  );
}
```

### Step 2: Update SettingsTabs.tsx

```tsx
// Add import
import { IntegrationsTab } from './tabs/IntegrationsTab';

// Update validation array
useEffect(() => {
  const hash = window.location.hash.replace('#', '');
  if (['profile', 'account', 'preferences', 'advanced', 'integrations'].includes(hash)) {
    setActiveTab(hash);
  }
}, []);

// Add tab trigger
<TabsTrigger value="integrations" className="...">
  <Plug className="h-4 w-4 flex-shrink-0" />
  <span className="hidden sm:inline">Integrations</span>
</TabsTrigger>

// Add tab content
<TabsContent value="integrations" className="mt-0 focus-visible:outline-none">
  <IntegrationsTab />
</TabsContent>
```

## Form Handling Patterns

### Profile Update Example

```tsx
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!firstName.trim()) {
    toast.error('Validation Error', 'First name is required');
    return;
  }

  // Loading state
  setIsSaving(true);

  try {
    // API call
    await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
    });

    // Success feedback
    toast.success('Saved', 'Profile updated successfully');
  } catch (error) {
    console.error('Failed to save:', error);
    toast.error('Save Failed', 'Failed to update profile');
  } finally {
    setIsSaving(false);
  }
};
```

### Toggle with Side Effects

```tsx
const handleNotificationToggle = async (checked: boolean) => {
  setEmailNotifications(checked);

  // If turning off, disable all sub-notifications
  if (!checked) {
    setStarmapCompletion(false);
    setWeeklyDigest(false);
  }

  // Persist to backend (optional)
  try {
    await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailNotifications: checked }),
    });
  } catch (error) {
    console.error('Failed to save preference:', error);
    // Revert on error
    setEmailNotifications(!checked);
  }
};
```

### File Upload with Progress

```tsx
const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validation
  if (!file.type.startsWith('image/')) {
    toast.error('Invalid File', 'Please upload an image');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error('File Too Large', 'Max size 5MB');
    return;
  }

  setIsUploading(true);

  try {
    const url = await uploadAvatar(file);
    toast.success('Success', 'Photo updated');
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error('Upload Failed', 'Could not update photo');
  } finally {
    setIsUploading(false);
  }
};
```

## Toast Notification Patterns

### Success Notifications

```tsx
// Simple success
toast.success('Saved', 'Changes saved successfully');

// With details
toast.success('Export Complete', 'Downloaded smartslate-data.json');

// With action
toast.success('Account Created', 'Check your email to verify', {
  action: {
    label: 'Resend',
    onClick: () => resendVerification(),
  },
});
```

### Error Handling

```tsx
try {
  await performAction();
} catch (error) {
  // Generic error
  toast.error('Action Failed', 'Something went wrong');

  // Specific error
  if (error instanceof ValidationError) {
    toast.error('Validation Error', error.message);
  } else if (error instanceof NetworkError) {
    toast.error('Network Error', 'Check your connection');
  } else {
    toast.error('Unexpected Error', 'Please try again');
  }
}
```

### Loading States

```tsx
// Promise-based loading
await toast.promise(
  performAsyncAction(),
  {
    loading: 'Processing...',
    success: 'Action completed',
    error: (err) => `Failed: ${err.message}`,
  }
);

// Manual loading
const toastId = toast.loading('Uploading...');
try {
  await upload();
  toast.success('Uploaded', { id: toastId });
} catch (error) {
  toast.error('Upload failed', { id: toastId });
}
```

## Progressive Disclosure Patterns

### Collapsible Section

```tsx
const [showSection, setShowSection] = useState(false);

return (
  <>
    <button onClick={() => setShowSection(!showSection)}>
      {showSection ? 'Hide' : 'Show'} Advanced Options
    </button>

    {showSection && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Advanced content */}
      </motion.div>
    )}
  </>
);
```

### Two-Step Confirmation

```tsx
const [step, setStep] = useState<'initial' | 'confirm'>('initial');

return (
  <>
    {step === 'initial' && (
      <Button onClick={() => setStep('confirm')}>
        Delete Account
      </Button>
    )}

    {step === 'confirm' && (
      <div className="space-y-4">
        <Input
          placeholder="Type DELETE to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <div className="flex gap-3">
          <Button
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE'}
          >
            Confirm Deletion
          </Button>
          <Button
            variant="ghost"
            onClick={() => setStep('initial')}
          >
            Cancel
          </Button>
        </div>
      </div>
    )}
  </>
);
```

## Responsive Patterns

### Mobile-First Layout

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  {/* Single column on mobile, two columns on tablet+ */}
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

### Conditional Rendering

```tsx
// Show different content based on screen size
const isMobile = useMediaQuery('(max-width: 640px)');

return (
  <>
    {isMobile ? (
      <CompactMobileView />
    ) : (
      <DetailedDesktopView />
    )}
  </>
);
```

### Touch-Optimized Buttons

```tsx
// Always ensure minimum 44px touch target
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Tap Me
</button>

// Icon-only on mobile, text on desktop
<button className="min-h-[44px] px-3">
  <Icon className="h-5 w-5" />
  <span className="hidden sm:inline ml-2">Text</span>
</button>
```

## Accessibility Patterns

### Keyboard Navigation

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleOption();
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={toggleOption}
>
  {/* Interactive content */}
</div>
```

### Focus Management

```tsx
const buttonRef = useRef<HTMLButtonElement>(null);

// Focus element after action
const handleSubmit = async () => {
  await performAction();
  buttonRef.current?.focus();
};

<button ref={buttonRef}>
  Action
</button>
```

### Screen Reader Announcements

```tsx
// Live region for dynamic updates
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>

// Descriptive button labels
<button aria-label="Delete profile photo">
  <Trash2 className="h-4 w-4" />
</button>
```

## State Synchronization

### Profile Data Sync

```tsx
const { profile } = useUserProfile();

// Sync local state with fetched data
useEffect(() => {
  if (profile) {
    setFirstName(profile.first_name || '');
    setLastName(profile.last_name || '');
    setEmail(profile.email || '');
  }
}, [profile]);
```

### Optimistic Updates

```tsx
const [localValue, setLocalValue] = useState(serverValue);

const handleChange = async (newValue: string) => {
  // Update UI immediately (optimistic)
  setLocalValue(newValue);

  try {
    // Persist to server
    await updateServer(newValue);
  } catch (error) {
    // Revert on error
    setLocalValue(serverValue);
    toast.error('Update Failed', 'Reverting changes');
  }
};
```

## Testing Examples

### Component Test

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileTab } from '@/components/settings/tabs/ProfileTab';

describe('ProfileTab', () => {
  it('renders profile form', () => {
    render(<ProfileTab />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ProfileTab />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
  });
});
```

### Integration Test

```tsx
describe('Settings Page', () => {
  it('navigates between tabs', () => {
    render(<SettingsPage />);

    // Start on Profile tab
    expect(screen.getByText('Profile Information')).toBeInTheDocument();

    // Click Account tab
    fireEvent.click(screen.getByRole('tab', { name: /account/i }));

    // Should show Account content
    expect(screen.getByText('Subscription & Usage')).toBeInTheDocument();
  });

  it('persists active tab in URL', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('tab', { name: /preferences/i }));

    expect(window.location.hash).toBe('#preferences');
  });
});
```

## Performance Optimization

### Memoization

```tsx
const expensiveCalculation = useMemo(() => {
  return profile?.blueprints?.map(/* expensive operation */);
}, [profile?.blueprints]);

const handleClick = useCallback(() => {
  performAction();
}, [/* dependencies */]);
```

### Lazy Loading Images

```tsx
<img
  src={profile.avatar_url}
  alt="Profile"
  loading="lazy"
  className="h-20 w-20 rounded-xl"
/>
```

### Debounced Input

```tsx
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebouncedValue(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);

<Input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search..."
/>
```

---

**Usage Guide Version**: 1.0
**Last Updated**: 2025-11-09
**For**: SmartSlate Polaris v3 Settings Page
