import React from 'react';
import { LucideIcon } from 'lucide-react';
import {
  SelectContainer,
  SelectIcon,
  StyledSelect,
  SelectWithCustomArrow,
  SelectGroup,
  SelectLabel,
  SelectError,
  SelectHelp,
  MultiSelectContainer,
  MultiSelectTag,
  MultiSelectInput,
} from './Select.styled';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  label?: string;
  error?: string;
  help?: string;
  className?: string;
}

export interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
}

// Basic Select component
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  disabled = false,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  label,
  error,
  help,
  className,
  ...props
}) => {
  const selectElement = (
    <SelectContainer className={className}>
      {Icon && (
        <SelectIcon hasIcon={true}>
          <Icon size={20} />
        </SelectIcon>
      )}
      <StyledSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        variant={variant}
        size={size}
        hasIcon={!!Icon}
        fullWidth={fullWidth}
        {...props}
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
      </StyledSelect>
    </SelectContainer>
  );

  if (label || error || help) {
    return (
      <SelectGroup>
        {label && <SelectLabel>{label}</SelectLabel>}
        {selectElement}
        {error && <SelectError>{error}</SelectError>}
        {help && <SelectHelp>{help}</SelectHelp>}
      </SelectGroup>
    );
  }

  return selectElement;
};

// Select with custom arrow
export const SelectWithArrow: React.FC<SelectProps> = (props) => {
  return (
    <SelectWithCustomArrow>
      <StyledSelect
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        variant={props.variant}
        size={props.size}
        hasIcon={!!props.icon}
        fullWidth={props.fullWidth}
      >
        {props.placeholder && (
          <option value="" disabled>
            {props.placeholder}
          </option>
        )}
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
    </SelectWithCustomArrow>
  );
};

// Multi-select component
export const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  maxTags = 10,
  className,
}) => {
  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleAddTag = (newTag: string) => {
    if (newTag && !value.includes(newTag) && value.length < maxTags) {
      onChange([...value, newTag]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const newTag = input.value.trim();
      if (newTag) {
        handleAddTag(newTag);
        input.value = '';
      }
    }
  };

  return (
    <MultiSelectContainer className={className}>
      {value.map((tag) => (
        <MultiSelectTag key={tag}>
          {tag}
          <button
            type="button"
            className="remove-tag"
            onClick={() => handleRemoveTag(tag)}
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </MultiSelectTag>
      ))}
      <MultiSelectInput
        type="text"
        placeholder={
          value.length < maxTags ? placeholder : 'Maximum tags reached'
        }
        onKeyDown={handleKeyDown}
        disabled={disabled || value.length >= maxTags}
      />
    </MultiSelectContainer>
  );
};

// Named exports
export {
  SelectContainer,
  SelectIcon,
  StyledSelect,
  SelectWithCustomArrow,
  SelectGroup,
  SelectLabel,
  SelectError,
  SelectHelp,
  MultiSelectContainer,
  MultiSelectTag,
  MultiSelectInput,
};

// Default export
export default Select;
