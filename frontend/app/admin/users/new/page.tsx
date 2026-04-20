'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  UserPlus,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/utils/toast';
import Link from 'next/link';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  user_role: string;
  subscription_tier: string;
  send_email: boolean;
  email_confirm: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_name?: string;
  user_role?: string;
  subscription_tier?: string;
}

const USER_ROLES = [
  { value: 'user', label: 'User', description: 'Standard user access' },
  { value: 'developer', label: 'Developer', description: 'Development and admin access' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
];

const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Free Tier' },
  { value: 'explorer', label: 'Explorer' },
  { value: 'navigator', label: 'Navigator' },
  { value: 'voyager', label: 'Voyager' },
  { value: 'crew', label: 'Crew Member' },
  { value: 'fleet', label: 'Fleet Member' },
  { value: 'armada', label: 'Armada Member' },
];

export default function AddUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    user_role: 'user',
    subscription_tier: 'free',
    send_email: true,
    email_confirm: false,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time validation
  const validateField = (name: keyof FormData, value: string | boolean): string | undefined => {
    switch (name) {
      case 'email':
        if (!value || typeof value !== 'string') return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return undefined;

      case 'password':
        if (!value || typeof value !== 'string') return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        return undefined;

      case 'confirmPassword':
        if (!value || typeof value !== 'string') return 'Please confirm password';
        if (value !== formData.password) return 'Passwords do not match';
        return undefined;

      case 'full_name':
        if (!value || typeof value !== 'string') return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (name: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Validate on blur for better UX
    if (typeof value === 'string' && value) {
      const error = validateField(name, value);
      if (error) {
        setFormErrors((prev) => ({ ...prev, [name]: error }));
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    const emailError = validateField('email', formData.email);
    if (emailError) errors.email = emailError;

    const passwordError = validateField('password', formData.password);
    if (passwordError) errors.password = passwordError;

    const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    const fullNameError = validateField('full_name', formData.full_name);
    if (fullNameError) errors.full_name = fullNameError;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Validation failed', 'Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          user_role: formData.user_role,
          subscription_tier: formData.subscription_tier,
          send_email: formData.send_email,
          email_confirm: formData.email_confirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('User created successfully', `${formData.email} has been added to the system`);

      // Redirect to users page after a short delay
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error('Failed to create user', errorMessage);
      console.error('Create user error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Link href="/admin/users">
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <UserPlus className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Add <span className="text-primary">User</span>
                </h1>
                <p className="mt-2 text-lg text-white/70">
                  Create a new user account with custom settings
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Credentials */}
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold text-white">Account Credentials</h3>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-white/70">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => {
                        const error = validateField('email', formData.email);
                        if (error) setFormErrors((prev) => ({ ...prev, email: error }));
                      }}
                      className={`mt-2 ${
                        formErrors.email
                          ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                          : ''
                      }`}
                      placeholder="user@example.com"
                      disabled={isSubmitting}
                    />
                    {formErrors.email && (
                      <p className="mt-2 text-xs text-red-400">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password" className="text-white/70">
                      Password *
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        onBlur={() => {
                          const error = validateField('password', formData.password);
                          if (error) setFormErrors((prev) => ({ ...prev, password: error }));
                        }}
                        className={`pr-10 ${
                          formErrors.password
                            ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                            : ''
                        }`}
                        placeholder="Enter strong password"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-white/60"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-2 text-xs text-red-400">{formErrors.password}</p>
                    )}
                    <p className="mt-2 text-xs text-white/40">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="confirmPassword" className="text-white/70">
                      Confirm Password *
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        onBlur={() => {
                          const error = validateField('confirmPassword', formData.confirmPassword);
                          if (error) setFormErrors((prev) => ({ ...prev, confirmPassword: error }));
                        }}
                        className={`pr-10 ${
                          formErrors.confirmPassword
                            ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                            : ''
                        }`}
                        placeholder="Re-enter password"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-white/60"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="mt-2 text-xs text-red-400">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* User Information */}
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold text-white">User Information</h3>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <Label htmlFor="full_name" className="text-white/70">
                      Full Name *
                    </Label>
                    <Input
                      id="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      onBlur={() => {
                        const error = validateField('full_name', formData.full_name);
                        if (error) setFormErrors((prev) => ({ ...prev, full_name: error }));
                      }}
                      className={`mt-2 ${
                        formErrors.full_name
                          ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                          : ''
                      }`}
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                    {formErrors.full_name && (
                      <p className="mt-2 text-xs text-red-400">{formErrors.full_name}</p>
                    )}
                  </div>

                  {/* User Role */}
                  <div>
                    <Label htmlFor="user_role" className="text-white/70">
                      User Role *
                    </Label>
                    <Select
                      value={formData.user_role}
                      onValueChange={(value) => handleChange('user_role', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#020C1B]/95 backdrop-blur-sm">
                        {USER_ROLES.map((role) => (
                          <SelectItem
                            key={role.value}
                            value={role.value}
                            className="text-white hover:bg-white/10 focus:bg-white/10"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{role.label}</span>
                              <span className="text-xs text-white/60">{role.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subscription Tier */}
                  <div>
                    <Label htmlFor="subscription_tier" className="text-white/70">
                      Subscription Tier *
                    </Label>
                    <Select
                      value={formData.subscription_tier}
                      onValueChange={(value) => handleChange('subscription_tier', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#020C1B]/95 backdrop-blur-sm">
                        {SUBSCRIPTION_TIERS.map((tier) => (
                          <SelectItem
                            key={tier.value}
                            value={tier.value}
                            className="text-white hover:bg-white/10 focus:bg-white/10"
                          >
                            {tier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </GlassCard>

              {/* Email Options */}
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold text-white">Email Options</h3>

                <div className="space-y-4">
                  <label className="flex cursor-pointer items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-white/5">
                    <Checkbox
                      checked={formData.send_email}
                      onCheckedChange={(checked) => handleChange('send_email', checked === true)}
                      className="mt-0.5 border-white/20"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm font-medium text-white">Send welcome email</span>
                      </div>
                      <p className="mt-1 text-xs text-white/60">
                        Send an email to the user with their account details and login instructions
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-white/5">
                    <Checkbox
                      checked={formData.email_confirm}
                      onCheckedChange={(checked) => handleChange('email_confirm', checked === true)}
                      className="mt-0.5 border-white/20"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm font-medium text-white">
                          Auto-confirm email address
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/60">
                        Mark the email as verified without requiring the user to click a
                        confirmation link
                      </p>
                    </div>
                  </label>
                </div>
              </GlassCard>

              {/* Form Actions */}
              <div className="flex items-center justify-between">
                <Link href="/admin/users">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </Link>

                <Button
                  type="submit"
                  disabled={isSubmitting || Object.keys(formErrors).length > 0}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
