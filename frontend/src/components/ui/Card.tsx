import React from 'react';
import { Card as RadixCard, Heading, Text, Flex } from '@radix-ui/themes';
import { cn } from '@/lib/utils';

// 기본 Card Props
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

// Card 하위 컴포넌트 Props
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

// 메인 Card 컴포넌트
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  size = 'default',
}) => {
  // Map variants to Radix Card props
  const variantProps: {
    variant?: 'surface' | 'classic' | 'ghost';
    style?: React.CSSProperties;
  } = {};

  if (variant === 'outline') {
    variantProps.variant = 'classic';
  } else if (variant === 'ghost') {
    variantProps.variant = 'ghost';
  } else {
    variantProps.variant = 'surface';
  }

  // Add custom styles for elevated variant
  const customStyles =
    variant === 'elevated'
      ? { boxShadow: 'var(--shadow-4)' }
      : onClick
        ? { cursor: 'pointer' }
        : undefined;

  return (
    <RadixCard
      {...variantProps}
      style={customStyles}
      className={cn(
        'transition-all duration-300 ease-in-out',
        onClick && 'hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </RadixCard>
  );
};

// Card 하위 컴포넌트들
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <Flex direction="column" gap="2" className={cn('p-6 pb-0', className)}>
      {children}
    </Flex>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
}) => {
  return (
    <Heading size="6" className={cn('leading-none tracking-tight', className)}>
      {children}
    </Heading>
  );
};

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className = '',
}) => {
  return (
    <Text size="2" color="gray" className={cn('mt-1.5', className)}>
      {children}
    </Text>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={cn('p-6', className)}>{children}</div>;
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <Flex align="center" className={cn('p-6 pt-0', className)}>
      {children}
    </Flex>
  );
};

export default Card;
