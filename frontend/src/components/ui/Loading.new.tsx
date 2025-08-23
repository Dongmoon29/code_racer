import React from 'react';
import {
  Spinner,
  LoadingContainer,
  FullScreenLoading,
  LoadingWithText,
  LoadingText,
  Skeleton,
  LoadingDots,
  LoadingDot,
  PulseLoading,
} from './Loading.styled';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
}

export interface SkeletonProps {
  width?: string;
  height?: string;
  count?: number;
}

// Main Loading component
const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  fullScreen = false,
  text,
  variant = 'spinner',
}) => {
  if (fullScreen) {
    return (
      <FullScreenLoading>
        {variant === 'spinner' && <Spinner size={size} />}
        {variant === 'dots' && (
          <LoadingDots>
            <LoadingDot delay={0} />
            <LoadingDot delay={0.2} />
            <LoadingDot delay={0.4} />
          </LoadingDots>
        )}
        {variant === 'pulse' && <PulseLoading size={size} />}
        {text && <LoadingText>{text}</LoadingText>}
      </FullScreenLoading>
    );
  }

  if (text) {
    return (
      <LoadingWithText>
        {variant === 'spinner' && <Spinner size={size} />}
        {variant === 'dots' && (
          <LoadingDots>
            <LoadingDot delay={0} />
            <LoadingDot delay={0.2} />
            <LoadingDot delay={0.4} />
          </LoadingDots>
        )}
        {variant === 'pulse' && <PulseLoading size={size} />}
        <LoadingText>{text}</LoadingText>
      </LoadingWithText>
    );
  }

  return (
    <LoadingContainer>
      {variant === 'spinner' && <Spinner size={size} />}
      {variant === 'dots' && (
        <LoadingDots>
          <LoadingDot delay={0} />
          <LoadingDot delay={0.2} />
          <LoadingDot delay={0.4} />
        </LoadingDots>
      )}
      {variant === 'pulse' && <PulseLoading size={size} />}
    </LoadingContainer>
  );
};

// Skeleton Loading component
export const SkeletonLoading: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  count = 1,
}) => {
  if (count === 1) {
    return <Skeleton width={width} height={height} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} width={width} height={height} />
      ))}
    </div>
  );
};

// Loading dots component
export const LoadingDotsComponent: React.FC = () => (
  <LoadingDots>
    <LoadingDot delay={0} />
    <LoadingDot delay={0.2} />
    <LoadingDot delay={0.4} />
  </LoadingDots>
);

// Pulse loading component
export const PulseLoadingComponent: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  size = 'md',
}) => <PulseLoading size={size} />;

// Named exports
export {
  Spinner,
  LoadingContainer,
  FullScreenLoading,
  LoadingWithText,
  LoadingText,
  Skeleton,
  LoadingDots,
  LoadingDot,
  PulseLoading,
};

// Default export
export default Loading;
