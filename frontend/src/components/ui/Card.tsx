import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        bg-[hsl(var(--card))]
        text-[hsl(var(--card-foreground))]
        rounded-xl 
        border 
        border-border 
        overflow-hidden 
        hover:shadow-lg 
        transition-all
        duration-300
        ease-in-out
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}
