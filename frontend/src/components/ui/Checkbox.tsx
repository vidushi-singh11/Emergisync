import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-1">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div className={cn(
            "w-5 h-5 rounded border border-[#2a2a3a] bg-[#14141e] transition-all",
            "peer-checked:bg-accent-cyan peer-checked:border-accent-cyan",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-accent-cyan/15",
            className
          )} />
          <Check className="absolute inset-0 w-5 h-5 text-void-black opacity-0 peer-checked:opacity-100 transition-opacity p-0.5" />
        </div>
        {label && <span className="text-[14px] text-text-secondary group-hover:text-text-primary transition-colors leading-tight">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
