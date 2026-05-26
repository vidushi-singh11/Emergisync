import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, required, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-[14px] font-medium text-text-secondary flex items-center gap-1">
            {label}
            {required && <span className="text-accent-cyan">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              "flex h-[52px] w-full appearance-none rounded-xl border border-[#2a2a3a] bg-[#14141e] px-4 py-2 text-[16px] text-text-primary ring-offset-void-black",
              "focus-visible:outline-none focus-visible:border-accent-cyan focus-visible:ring-2 focus-visible:ring-accent-cyan/15",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-accent-crimson focus-visible:border-accent-crimson focus-visible:ring-accent-crimson/15",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
            <ChevronDown size={20} />
          </div>
        </div>
        {error && (
          <p className="text-[13px] text-accent-crimson flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
