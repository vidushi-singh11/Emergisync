import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, type, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-[14px] font-medium text-text-secondary flex items-center gap-1">
            {label}
            {required && <span className="text-accent-cyan">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-[52px] w-full rounded-xl border border-[#2a2a3a] bg-[#14141e] px-4 py-2 text-[16px] text-text-primary ring-offset-void-black",
              "placeholder:text-text-muted",
              "focus-visible:outline-none focus-visible:border-accent-cyan focus-visible:ring-2 focus-visible:ring-accent-cyan/15",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-accent-crimson focus-visible:border-accent-crimson focus-visible:ring-accent-crimson/15",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[13px] text-accent-crimson flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
