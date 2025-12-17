import React from 'react';
import { Badge as RadixBadge } from '@radix-ui/themes';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  color?: 'gray' | 'gold' | 'bronze' | 'brown' | 'yellow' | 'amber' | 'orange' | 'tomato' | 'red' | 'ruby' | 'crimson' | 'pink' | 'plum' | 'purple' | 'violet' | 'iris' | 'indigo' | 'blue' | 'cyan' | 'teal' | 'jade' | 'green' | 'grass' | 'lime' | 'mint' | 'sky';
  size?: '1' | '2' | '3';
  radius?: 'none' | 'small' | 'medium' | 'large' | 'full';
}

// Map our variants to Radix Badge variants
const variantMap: Record<NonNullable<BadgeProps['variant']>, 'solid' | 'soft' | 'outline'> = {
  default: 'solid',
  secondary: 'soft',
  destructive: 'solid',
  outline: 'outline',
};

// Map our variants to Radix Badge colors
const variantToColor: Record<NonNullable<BadgeProps['variant']>, BadgeProps['color']> = {
  default: undefined, // Use default accent color
  secondary: 'gray',
  destructive: 'red',
  outline: undefined,
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', color, size = '2', radius, children, ...props }, ref) => {
    const radixVariant = variantMap[variant];
    const radixColor = color || variantToColor[variant];

    return (
      <RadixBadge
        ref={ref}
        variant={radixVariant}
        color={radixColor}
        size={size}
        radius={radius}
        className={cn(className)}
        {...props}
      >
        {children}
      </RadixBadge>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
