'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, CheckCircle2, Lightbulb, Star, Flame } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingButton } from '@/components/ui/button';
import {
  featureRequestSubmissionSchema,
  type FeatureRequestSubmission,
  featureCategoryLabels,
  priorityLabels,
} from '@/lib/schemas/feedbackSchemas';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Priority icons and colors
const priorityConfig = {
  nice_to_have: {
    icon: Lightbulb,
    color: 'text-neutral-400',
    bgColor: 'bg-neutral-400/10',
    borderColor: 'border-neutral-400',
    label: 'Nice to Have',
    emoji: '💡',
  },
  would_help: {
    icon: Star,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning',
    label: 'Would Really Help',
    emoji: '⭐',
  },
  must_have: {
    icon: Flame,
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error',
    label: 'Must Have',
    emoji: '🔥',
  },
};

/**
 * FeatureRequestModal Component
 *
 * Modal form for submitting feature requests for Smartslate Polaris.
 * Includes title input, description textarea, category dropdown,
 * priority radio pills, and optional email input.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Real-time character counters
 * - Auto-resize textarea
 * - Visual priority selection with colors
 * - Submission with loading state
 * - Success animation with auto-close
 * - Toast notifications
 * - Keyboard navigation and focus trap
 */
export function FeatureRequestModal({ open, onOpenChange }: FeatureRequestModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [titleLength, setTitleLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeatureRequestSubmission>({
    resolver: zodResolver(featureRequestSubmissionSchema),
    defaultValues: {
      title: '',
      description: '',
      category: undefined,
      priorityFromUser: undefined,
      userEmail: user?.email || '',
    },
  });

  const title = watch('title');
  const description = watch('description');
  const category = watch('category');
  const priorityFromUser = watch('priorityFromUser');

  // Update character lengths
  React.useEffect(() => {
    setTitleLength(title?.length || 0);
    setDescriptionLength(description?.length || 0);
  }, [title, description]);

  const onSubmit = async (data: FeatureRequestSubmission) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feature-requests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userAgent: navigator.userAgent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please log in to submit a feature request');
          onOpenChange(false);
          return;
        }
        throw new Error(result.error || 'Failed to submit feature request');
      }

      // Show success animation
      setIsSuccess(true);
      toast.success('Feature request submitted!', {
        description: "We'll review your request and prioritize accordingly.",
      });

      // Auto-close after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setTimeout(() => {
          setIsSuccess(false);
          reset();
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Feature request submission error:', error);
      toast.error('Failed to submit feature request', {
        description: error instanceof Error ? error.message : 'Please try again later',
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(onSubmit)(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setTimeout(() => {
        reset();
        setIsSuccess(false);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="glass-card border-secondary/20 max-h-[90vh] overflow-y-auto border sm:max-w-[700px]"
        aria-describedby="feature-request-description"
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            // Success State
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle2 className="text-success h-20 w-20" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-title text-success mt-6 font-bold"
              >
                Request Submitted!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-body text-text-secondary mt-2 text-center"
              >
                We'll review your feature request and prioritize accordingly.
              </motion.p>
            </motion.div>
          ) : (
            // Form State
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Sparkles className="text-secondary h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-title text-foreground">
                      Request a Feature
                    </DialogTitle>
                    <DialogDescription id="feature-request-description" className="text-caption">
                      Describe the capability you need
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground text-sm font-medium">
                    Feature Title <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Briefly describe the feature..."
                    className="min-h-[48px]"
                    maxLength={200}
                    aria-describedby="title-counter title-error"
                  />
                  <div className="flex items-center justify-between">
                    <span
                      id="title-counter"
                      className={cn(
                        'text-xs',
                        titleLength > 200
                          ? 'text-error'
                          : titleLength > 180
                            ? 'text-warning'
                            : 'text-text-secondary'
                      )}
                    >
                      {titleLength} / 200 characters
                    </span>
                  </div>
                  {errors.title && (
                    <p id="title-error" className="text-error text-sm" role="alert">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground text-sm font-medium">
                    Description <span className="text-error">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe what you'd like to build and why it would be valuable..."
                    className="min-h-[160px] resize-y"
                    maxLength={3000}
                    aria-describedby="description-counter description-error"
                  />
                  <div className="flex items-center justify-between">
                    <span
                      id="description-counter"
                      className={cn(
                        'text-xs',
                        descriptionLength > 3000
                          ? 'text-error'
                          : descriptionLength > 2800
                            ? 'text-warning'
                            : 'text-text-secondary'
                      )}
                    >
                      {descriptionLength} / 3000 characters
                    </span>
                  </div>
                  {errors.description && (
                    <p id="description-error" className="text-error text-sm" role="alert">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground text-sm font-medium">
                    Category <span className="text-error">*</span>
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(value) =>
                      setValue('category', value as any, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger
                      id="category"
                      className="min-h-[48px]"
                      aria-label="Feature category"
                    >
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(featureCategoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-error text-sm" role="alert">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* Priority Selection */}
                <div className="space-y-3">
                  <Label className="text-foreground text-sm font-medium">
                    Priority <span className="text-error">*</span>
                  </Label>
                  <div
                    className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                    role="radiogroup"
                    aria-label="Feature priority"
                  >
                    {Object.entries(priorityConfig).map(([value, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setValue('priorityFromUser', value as any, { shouldValidate: true })
                          }
                          className={cn(
                            'group relative flex min-h-[64px] flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all',
                            priorityFromUser === value
                              ? `${config.borderColor} ${config.bgColor} ${config.color}`
                              : 'text-text-secondary border-neutral-200 bg-white/5 hover:border-neutral-300 hover:bg-white/10',
                            'touch-manipulation'
                          )}
                          role="radio"
                          aria-checked={priorityFromUser === value}
                          aria-label={config.label}
                        >
                          <span className="text-2xl">{config.emoji}</span>
                          <span className="text-center text-xs">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.priorityFromUser && (
                    <p className="text-error text-sm" role="alert">
                      {errors.priorityFromUser.message}
                    </p>
                  )}
                </div>

                {/* Optional Email */}
                <div className="space-y-2">
                  <Label htmlFor="userEmail" className="text-foreground text-sm font-medium">
                    Contact Email (optional)
                  </Label>
                  <Input
                    id="userEmail"
                    type="email"
                    {...register('userEmail')}
                    placeholder="your@email.com"
                    defaultValue={user?.email || ''}
                    className="min-h-[48px]"
                  />
                  <p className="text-text-secondary text-xs">
                    We'll contact you when this feature is implemented
                  </p>
                  {errors.userEmail && (
                    <p className="text-error text-sm" role="alert">
                      {errors.userEmail.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <LoadingButton
                    type="submit"
                    loading={isSubmitting}
                    loadingText="Submitting..."
                    size="large"
                    className="flex-1 gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4 text-white" />
                    <span className="text-white">Submit Request</span>
                  </LoadingButton>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
