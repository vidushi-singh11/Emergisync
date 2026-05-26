import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-button font-semibold transition-all duration-200',
          {
            'bg-accent-cyan/10 border border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-void-black hover:shadow-glow-cyan':
              variant === 'primary',
            'bg-transparent border border-border-glow text-text-primary hover:border-accent-cyan hover:text-accent-cyan':
              variant === 'secondary',
            'bg-transparent text-text-muted hover:text-text-primary': variant === 'ghost',
            'h-10 px-4 text-sm': size === 'sm',
            'h-11 px-6 text-sm': size === 'md',
            'h-14 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
