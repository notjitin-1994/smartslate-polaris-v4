'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
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
  feedbackSubmissionSchema,
  type FeedbackSubmission,
  sentimentLabels,
  feedbackCategoryLabels,
} from '@/lib/schemas/feedbackSchemas';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * FeedbackModal Component
 *
 * Modal form for submitting general feedback about SmartSlate.
 * Includes sentiment selection (emoji radio pills), category dropdown,
 * message textarea, and optional email input.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Real-time character counters
 * - Auto-resize textarea
 * - Submission with loading state
 * - Success animation with auto-close
 * - Toast notifications
 * - Keyboard navigation and focus trap
 */
export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [messageLength, setMessageLength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeedbackSubmission>({
    resolver: zodResolver(feedbackSubmissionSchema),
    defaultValues: {
      sentiment: undefined,
      category: undefined,
      message: '',
      userEmail: user?.email || '',
    },
  });

  const sentiment = watch('sentiment');
  const message = watch('message');
  const category = watch('category');

  // Update message length
  React.useEffect(() => {
    setMessageLength(message?.length || 0);
  }, [message]);

  const onSubmit = async (data: FeedbackSubmission) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please log in to submit feedback');
          onOpenChange(false);
          return;
        }
        throw new Error(result.error || 'Failed to submit feedback');
      }

      // Show success animation
      setIsSuccess(true);
      toast.success('Feedback submitted successfully!', {
        description: 'Thank you for helping us improve Smartslate Polaris.',
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
      console.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback', {
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
        className="glass-card border-primary/20 max-h-[90vh] overflow-y-auto border sm:max-w-[600px]"
        aria-describedby="feedback-description"
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
                Feedback Submitted!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-body text-text-secondary mt-2 text-center"
              >
                Thank you for helping us improve Smartslate Polaris.
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
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                    <MessageSquare className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-title text-foreground">
                      Share Your Feedback
                    </DialogTitle>
                    <DialogDescription id="feedback-description" className="text-caption">
                      Help us improve Smartslate Polaris with your insights
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                {/* Sentiment Selection */}
                <div className="space-y-3">
                  <Label className="text-foreground text-sm font-medium">
                    How do you feel? <span className="text-error">*</span>
                  </Label>
                  <div
                    className="grid grid-cols-3 gap-3"
                    role="radiogroup"
                    aria-label="Feedback sentiment"
                  >
                    {Object.entries(sentimentLabels).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setValue('sentiment', value as any, { shouldValidate: true })
                        }
                        className={cn(
                          'group relative flex min-h-[56px] flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all',
                          sentiment === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'text-text-secondary hover:border-primary/50 border-neutral-200 bg-white/5 hover:bg-white/10',
                          'touch-manipulation'
                        )}
                        role="radio"
                        aria-checked={sentiment === value}
                        aria-label={label}
                      >
                        <span className="text-2xl">{label.split(' ')[0]}</span>
                        <span className="text-xs">{label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                  {errors.sentiment && (
                    <p className="text-error text-sm" role="alert">
                      {errors.sentiment.message}
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
                      aria-label="Feedback category"
                    >
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(feedbackCategoryLabels).map(([value, label]) => (
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

                {/* Message Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground text-sm font-medium">
                    Your Feedback <span className="text-error">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    {...register('message')}
                    placeholder="Share your thoughts..."
                    className="min-h-[120px] resize-y"
                    maxLength={2000}
                    aria-describedby="message-counter message-error"
                  />
                  <div className="flex items-center justify-between">
                    <span
                      id="message-counter"
                      className={cn(
                        'text-xs',
                        messageLength > 2000
                          ? 'text-error'
                          : messageLength > 1800
                            ? 'text-warning'
                            : 'text-text-secondary'
                      )}
                    >
                      {messageLength} / 2000 characters
                    </span>
                  </div>
                  {errors.message && (
                    <p id="message-error" className="text-error text-sm" role="alert">
                      {errors.message.message}
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
                    We'll only use this to follow up on your feedback
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
                    <span className="text-white">Submit Feedback</span>
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
