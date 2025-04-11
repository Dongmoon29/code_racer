import React from 'react';
import { LucideIcon } from 'lucide-react';

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
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  disabled = false,
  className = '',
}: SelectProps) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
          size={20}
        />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full 
          ${Icon ? 'pl-12' : 'pl-4'} 
          pr-4 
          py-2 
          rounded-lg 
          bg-[hsl(var(--card))] 
          border 
          border-input 
          text-[hsl(var(--foreground))] 
          focus:bg-[hsl(var(--background))] 
          focus:border-[hsl(var(--ring))] 
          focus:outline-none 
          focus:ring-1 
          focus:ring-[hsl(var(--ring))] 
          appearance-none 
          cursor-pointer 
          disabled:opacity-50
          disabled:cursor-not-allowed
          [&>option]:bg-[hsl(var(--background))] 
          [&>option]:text-[hsl(var(--foreground))]
          ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
