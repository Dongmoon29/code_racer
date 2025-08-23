import React from 'react';
import {
  StyledAlert,
  AlertTitle,
  AlertDescription,
  AlertWithIcon,
  DismissibleAlert,
} from './Alert.styled';

export interface AlertProps extends React.ComponentProps<'div'> {
  variant?: 'default' | 'destructive' | 'info' | 'success' | 'warning' | 'error';
  clickable?: boolean;
  children: React.ReactNode;
}

export interface AlertWithIconProps extends AlertProps {
  icon?: React.ReactNode;
}

export interface DismissibleAlertProps extends AlertProps {
  onDismiss?: () => void;
  dismissIcon?: React.ReactNode;
}

// Basic Alert component
export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  clickable = false,
  children,
  ...props
}) => {
  return (
    <StyledAlert
      role="alert"
      variant={variant}
      clickable={clickable}
      {...props}
    >
      {children}
    </StyledAlert>
  );
};

// Alert with icon
export const AlertWithIconComponent: React.FC<AlertWithIconProps> = ({
  variant = 'default',
  icon,
  children,
  ...props
}) => {
  return (
    <AlertWithIcon
      role="alert"
      variant={variant}
      {...props}
    >
      {icon && <span className="alert-icon">{icon}</span>}
      <div className="alert-content">{children}</div>
    </AlertWithIcon>
  );
};

// Dismissible alert
export const DismissibleAlertComponent: React.FC<DismissibleAlertProps> = ({
  variant = 'default',
  onDismiss,
  dismissIcon = '×',
  children,
  ...props
}) => {
  return (
    <DismissibleAlert
      role="alert"
      variant={variant}
      {...props}
    >
      <div className="alert-content">{children}</div>
      {onDismiss && (
        <button
          type="button"
          className="dismiss-button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          {dismissIcon}
        </button>
      )}
    </DismissibleAlert>
  );
};

// Named exports
export { AlertTitle, AlertDescription };

// Default export
export default Alert;
