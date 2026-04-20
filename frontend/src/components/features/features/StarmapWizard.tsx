import type { ReactNode } from 'react';

interface StepIndicatorProps {
  steps: Array<{ key: string; label: string; icon?: ReactNode; description?: string }>;
  currentStep: number;
  completedSteps?: number[];
  onStepClick: (index: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  const completed = completedSteps || [];
  return (
    <div className="relative">
      {/* Desktop Version */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completed.includes(index);
            const isAccessible = isCompleted || index <= currentStep;

            return (
              <div key={step.key} className="relative flex-1">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-1/2 h-0.5 w-full">
                    <div className="h-full w-full bg-transparent" />
                    <div
                      className={`bg-primary-500 absolute inset-0 transition-all duration-500 ${
                        completed.includes(index) ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}

                {/* Step Circle */}
                <button
                  onClick={() => isAccessible && onStepClick(index)}
                  disabled={!isAccessible}
                  className={`group relative z-10 mx-auto flex flex-col items-center ${
                    isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-primary-500 shadow-primary-500/30 scale-110 shadow-lg'
                        : isCompleted
                          ? 'border border-emerald-300/50 bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg ring-1 shadow-emerald-500/30 ring-emerald-300/30'
                          : isAccessible
                            ? 'border-primary-500 border bg-[rgb(var(--bg))]'
                            : 'border-primary-500 border bg-[rgb(var(--bg))]'
                    } `}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span
                        className={`text-lg font-bold ${isActive ? 'text-[rgb(var(--secondary-dark))]' : 'text-white/70'}`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-center">
                    <div
                      className={`text-sm font-medium transition-colors ${
                        isActive ? 'text-white' : isCompleted ? 'text-emerald-300' : 'text-white/70'
                      }`}
                    >
                      {step.label}
                    </div>
                    {step.description && (
                      <div className="mt-1 max-w-[120px] text-xs text-white/50">
                        {step.description}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Version */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
          <div className="flex-1">
            <div className="mb-1 text-xs tracking-wider text-white/50 uppercase">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-lg font-semibold text-white">{steps[currentStep].label}</div>
            {steps[currentStep].description && (
              <div className="mt-1 text-sm text-white/60">{steps[currentStep].description}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary-500 w-8'
                    : completed.includes(index)
                      ? 'bg-primary-500 w-2'
                      : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WizardContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  headerActions?: ReactNode;
}

export function WizardContainer({
  children,
  title,
  subtitle,
  description,
  icon,
  headerActions,
}: WizardContainerProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card overflow-hidden">
        {(title || subtitle || description) && (
          <div className="from-primary-500/10 to-secondary-500/10 border-b border-white/10 bg-gradient-to-r p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                {icon && (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 className="mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-2xl font-bold text-transparent text-white md:text-3xl">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm leading-relaxed text-white/70 md:text-base">{subtitle}</p>
                  )}
                  {description && <p className="mt-2 text-sm text-white/60">{description}</p>}
                </div>
              </div>
              {headerActions && <div className="flex-shrink-0">{headerActions}</div>}
            </div>
          </div>
        )}
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

interface FieldCardProps {
  children: ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  icon?: ReactNode;
}

export function FieldCard({ children, label, required, error, helper, icon }: FieldCardProps) {
  return (
    <div className="group">
      <div
        className={`relative rounded-xl border p-4 transition-all duration-200 ${
          error
            ? 'border-red-400/50 bg-red-500/5'
            : 'focus-within:border-primary-400/50 focus-within:bg-primary-400/5 border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
        } `}
      >
        {label && (
          <div className="mb-3 flex items-center gap-2">
            {icon && <div className="h-5 w-5 text-white/50">{icon}</div>}
            <label className="text-sm font-medium text-white/80">
              {label}
              {required && <span className="ml-1 text-red-400">*</span>}
            </label>
          </div>
        )}
        {children}
        {helper && !error && (
          <div className="mt-2 flex items-start gap-1 text-xs text-white/50">
            <svg className="mt-0.5 h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>{helper}</span>
          </div>
        )}
        {error && (
          <div className="mt-2 flex items-start gap-1 text-xs text-red-300">
            <svg className="mt-0.5 h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionButtonsProps {
  onBack?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  backLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  skipLabel?: string;
  isLoading?: boolean;
  nextDisabled?: boolean;
}

export function ActionButtons({
  onBack,
  onPrevious,
  onNext,
  onSkip,
  backLabel = 'Back',
  previousLabel = 'Previous',
  nextLabel = 'Continue',
  skipLabel = 'Skip',
  isLoading = false,
  nextDisabled = false,
}: ActionButtonsProps) {
  // Use onPrevious if provided, otherwise fall back to onBack
  const handleBack = onPrevious || onBack;
  const label = onPrevious ? previousLabel : backLabel;

  return (
    <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-8">
      <div>
        {handleBack && (
          <button
            type="button"
            onClick={handleBack}
            className="group flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
            disabled={isLoading}
            aria-label={label}
            title={label}
          >
            <svg
              className="text-primary-500 group-hover:text-primary-400 h-5 w-5 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="group flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
            disabled={isLoading}
            aria-label={skipLabel}
            title={skipLabel}
          >
            <svg
              className="text-secondary-500 group-hover:text-secondary-400 h-4 w-4 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className={`relative flex h-12 w-12 items-center justify-center rounded-xl font-medium transition-all duration-200 ${
              nextDisabled
                ? 'cursor-not-allowed bg-white/10 text-white/40'
                : 'bg-secondary-500 hover:bg-secondary-400 hover:shadow-secondary-500/25 text-white hover:scale-105 hover:shadow-lg'
            } `}
            disabled={nextDisabled || isLoading}
            aria-label={nextLabel}
            title={nextLabel}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percentage = (value / max) * 100;

  return (
    <div className="mt-6 space-y-4">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">{label}</span>
          <span className="font-medium text-white/80">
            {value} / {max}
          </span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="bg-primary-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
