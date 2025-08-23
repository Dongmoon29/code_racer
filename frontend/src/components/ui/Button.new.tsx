import React from 'react';
import { StyledButton, IconButton, ButtonGroup } from './Button.styled';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  // asChild = false, // Not implemented yet
  children,
  ...props
}) => {
  // Icon size인 경우 IconButton 사용
  if (size === 'icon') {
    return (
      <IconButton variant={variant} {...props}>
        {children}
      </IconButton>
    );
  }

  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

// Named exports
export { Button, ButtonGroup, IconButton };

// Default export
export default Button;
