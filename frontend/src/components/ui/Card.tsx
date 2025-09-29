import React from 'react';

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

// Variant 스타일 정의
const getVariantStyles = (variant: CardProps['variant'] = 'default') => {
  switch (variant) {
    case 'elevated':
      return 'shadow-lg hover:shadow-xl';
    case 'outline':
      return 'border-2 shadow-none';
    case 'ghost':
      return 'border-none shadow-none bg-transparent';
    default:
      return 'shadow-sm hover:shadow-lg';
  }
};

// Size 스타일 정의
const getSizeStyles = (size: CardProps['size'] = 'default') => {
  switch (size) {
    case 'sm':
      return 'text-sm';
    case 'lg':
      return 'text-lg';
    case 'xl':
      return 'text-xl';
    default:
      return 'text-base';
  }
};

// 메인 Card 컴포넌트
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  size = 'default',
}) => {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <div
      className={`
        bg-[hsl(var(--card))]
        text-[hsl(var(--card-foreground))]
        rounded-xl 
        border 
        border-border 
        overflow-hidden 
        transition-all
        duration-300
        ease-in-out
        p-3
        ${variantStyles}
        ${sizeStyles}
        ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Card 하위 컴포넌트들
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 pb-0 ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
}) => {
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className = '',
}) => {
  return (
    <p
      className={`text-sm text-[hsl(var(--muted-foreground))] mt-1.5 ${className}`}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`p-6 pt-0 flex items-center ${className}`}>{children}</div>
  );
};

export default Card;
