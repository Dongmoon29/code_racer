import React from 'react';
import {
  StyledCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardWithHeader,
  InteractiveCard,
} from './Card.styled';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  fullWidth?: boolean;
  clickable?: boolean;
  className?: string;
}

export interface CardWithHeaderProps extends CardProps {
  title?: string;
  description?: string;
}

// Basic Card component
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  clickable = false,
  className,
  ...props
}) => {
  if (clickable) {
    return (
      <InteractiveCard
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
        {...props}
      >
        {children}
      </InteractiveCard>
    );
  }

  return (
    <StyledCard
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

// Card with built-in header
export const CardWithHeaderComponent: React.FC<CardWithHeaderProps> = ({
  children,
  title,
  description,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  className,
  ...props
}) => {
  return (
    <CardWithHeader
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
      {...props}
    >
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </CardWithHeader>
  );
};

// Named exports
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

// Default export
export default Card;
