import * as React from 'react';
import { Button as RadixButton } from '@radix-ui/themes';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Map our variants to Radix Themes variants
const variantMap = {
  default: 'solid' as const,
  destructive: 'solid' as const,
  outline: 'outline' as const,
  secondary: 'soft' as const,
  ghost: 'ghost' as const,
  link: 'ghost' as const,
};

const sizeMap: Record<'default' | 'sm' | 'lg' | 'icon', '1' | '2' | '3'> = {
  default: '2',
  sm: '1',
  lg: '3',
  icon: '2',
};

// Keep buttonVariants for backward compatibility with custom styles
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: 'btn-neon', // Custom neon style
        destructive: '',
        outline: '',
        secondary: '',
        ghost: '',
        link: '',
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        icon: '',
      },
      cursor: {
        default: 'cursor-pointer',
        defaultCursor: 'cursor-default',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      cursor: 'default',
    },
  }
);

interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  color?:
    | 'gray'
    | 'gold'
    | 'bronze'
    | 'brown'
    | 'yellow'
    | 'amber'
    | 'orange'
    | 'tomato'
    | 'red'
    | 'ruby'
    | 'crimson'
    | 'pink'
    | 'plum'
    | 'purple'
    | 'violet'
    | 'iris'
    | 'indigo'
    | 'blue'
    | 'cyan'
    | 'teal'
    | 'jade'
    | 'green'
    | 'grass'
    | 'lime'
    | 'mint'
    | 'sky';
  radius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  highContrast?: boolean;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  cursor = 'default',
  asChild = false,
  color,
  radius,
  highContrast,
  ...props
}: ButtonProps) {
  // Use Radix Themes Button for most cases
  if (variant !== 'default' || !className?.includes('btn-neon')) {
    const radixVariant = (variant && variantMap[variant]) || 'solid';
    const radixSize: '1' | '2' | '3' = (size && sizeMap[size]) || '2';

    // Map destructive to red color
    const radixColor = color || (variant === 'destructive' ? 'red' : undefined);

    const cursorClass =
      cursor === 'defaultCursor' ? 'cursor-default' : 'cursor-pointer';

    if (asChild) {
      return (
        <Slot
          className={cn(
            buttonVariants({ variant, size }),
            cursorClass,
            className
          )}
          {...props}
        />
      );
    }

    return (
      <RadixButton
        variant={radixVariant}
        size={radixSize}
        color={radixColor}
        radius={radius}
        highContrast={highContrast}
        className={cn(cursorClass, className)}
        {...props}
      />
    );
  }

  // Keep custom neon button style for default variant
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, cursor, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
