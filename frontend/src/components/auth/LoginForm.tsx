'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

type LoginFormProps = {
  className?: string;
};

export function LoginForm({ className }: LoginFormProps): React.JSX.Element {
  const { signInWithPassword, loading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    await signInWithPassword(values.email, values.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      <div>
        <label htmlFor="email" className="text-foreground block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="glass text-foreground placeholder:text-foreground/50 focus-visible:ring-primary/50 focus-visible:ring-offset-background w-full rounded-md px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          {...register('email')}
        />
        {errors.email && <p className="text-error mt-1 text-sm">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="text-foreground block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="glass text-foreground placeholder:text-foreground/50 focus-visible:ring-primary/50 focus-visible:ring-offset-background w-full rounded-md px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          {...register('password')}
        />
        {errors.password && <p className="text-error mt-1 text-sm">{errors.password.message}</p>}
      </div>
      <Button
        aria-busy={loading}
        aria-live="polite"
        type="submit"
        variant="primary"
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}

export default LoginForm;
