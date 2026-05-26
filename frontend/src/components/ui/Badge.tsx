import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cyan' | 'amber' | 'crimson' | 'violet' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'cyan', children, ...props }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-badge px-3 py-1 text-[14px] font-medium uppercase tracking-wide-08',
        {
          'bg-border-glow border border-border-glow text-accent-cyan': variant === 'cyan',
          'bg-border-glow border border-border-glow text-accent-amber': variant === 'amber',
          'bg-border-glow border border-border-glow text-accent-crimson': variant === 'crimson',
          'bg-border-glow border border-border-glow text-accent-violet': variant === 'violet',
          'bg-transparent border border-border-glow text-text-muted': variant === 'outline',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
