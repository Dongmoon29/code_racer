import React from 'react';
import { Select as RadixSelect } from '@radix-ui/themes';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  size?: '1' | '2' | '3';
  variant?: 'surface' | 'classic' | 'soft' | 'ghost';
  color?: 'gray' | 'gold' | 'bronze' | 'brown' | 'yellow' | 'amber' | 'orange' | 'tomato' | 'red' | 'ruby' | 'crimson' | 'pink' | 'plum' | 'purple' | 'violet' | 'iris' | 'indigo' | 'blue' | 'cyan' | 'teal' | 'jade' | 'green' | 'grass' | 'lime' | 'mint' | 'sky';
  radius?: 'none' | 'small' | 'medium' | 'large' | 'full';
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  disabled = false,
  className = '',
  size = '2',
  variant = 'surface',
  color,
  radius,
}: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      {Icon && (
        <Icon
          className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 text-[var(--gray-9)] pointer-events-none"
          size={16}
        />
      )}
      <RadixSelect.Root
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        size={size}
      >
        <RadixSelect.Trigger
          variant={variant}
          color={color}
          radius={radius}
          className={cn(Icon && 'pl-10')}
        />
        <RadixSelect.Content>
          {placeholder && (
            <RadixSelect.Item value="" disabled>
              {placeholder}
            </RadixSelect.Item>
          )}
          {options.map((option) => (
            <RadixSelect.Item key={option.value} value={option.value}>
              {option.label}
            </RadixSelect.Item>
          ))}
        </RadixSelect.Content>
      </RadixSelect.Root>
    </div>
  );
}
