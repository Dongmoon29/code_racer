// Error tracking and logging utilities
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  gameId?: string;
  matchId?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  WEBSOCKET = 'websocket',
  VALIDATION = 'validation',
  API = 'api',
  UI = 'ui',
  UNKNOWN = 'unknown',
}

// Error tracking constants
const DEFAULT_ERROR_LIMIT = 10;
const MAX_ERRORS_TO_KEEP = 100;

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorInfo[] = [];
  private maxErrors = MAX_ERRORS_TO_KEEP;

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // Track error with context
  trackError(
    error: Error | unknown,
    context?: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN
  ): void {
    const errorInfo: ErrorInfo = {
      message: this.extractErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: Date.now(),
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Add to errors array
    this.errors.unshift(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console with enhanced information (development only)
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[${severity.toUpperCase()}] ${category.toUpperCase()} Error:`,
        {
          message: errorInfo.message,
          context: errorInfo.context,
          stack: errorInfo.stack,
          timestamp: new Date(errorInfo.timestamp).toISOString(),
        }
      );
    }

    // In production, you might want to send to external service like Sentry
    // if (process.env.NODE_ENV === 'production') {
    //   this.sendToExternalService(errorInfo, severity, category);
    // }
  }

  // Extract error message from various error types
  private extractErrorMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as Error).message);
    }
    return 'Unknown error occurred';
  }

  // TODO: Implement external error tracking service integration (Sentry, LogRocket, etc.)
  // When implemented, uncomment and use the following method:
  // private sendToExternalService(
  //   errorInfo: ErrorInfo,
  //   severity: ErrorSeverity,
  //   category: ErrorCategory
  // ): void {
  //   Sentry.captureException(error, { extra: errorInfo.context });
  // }

  // Get recent errors for debugging
  getRecentErrors(limit: number = DEFAULT_ERROR_LIMIT): ErrorInfo[] {
    return this.errors.slice(0, limit);
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = [];
  }
}

// Convenience functions for common error tracking scenarios
export const trackError = (
  error: Error | unknown,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  category: ErrorCategory = ErrorCategory.UNKNOWN
) => {
  ErrorTracker.getInstance().trackError(error, context, severity, category);
};

// Specific error tracking functions
export const trackNetworkError = (
  error: Error | unknown,
  context?: ErrorContext
) => {
  trackError(error, context, ErrorSeverity.MEDIUM, ErrorCategory.NETWORK);
};

export const trackWebSocketError = (
  error: Error | unknown,
  context?: ErrorContext
) => {
  trackError(error, context, ErrorSeverity.HIGH, ErrorCategory.WEBSOCKET);
};

export const trackAuthError = (
  error: Error | unknown,
  context?: ErrorContext
) => {
  trackError(error, context, ErrorSeverity.HIGH, ErrorCategory.AUTHENTICATION);
};

export const trackAPIError = (
  error: Error | unknown,
  context?: ErrorContext
) => {
  trackError(error, context, ErrorSeverity.MEDIUM, ErrorCategory.API);
};

export const trackUIError = (
  error: Error | unknown,
  context?: ErrorContext
) => {
  trackError(error, context, ErrorSeverity.LOW, ErrorCategory.UI);
};

// Error boundary helper
export const createErrorHandler = (
  component: string,
  action: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  category: ErrorCategory = ErrorCategory.UI
) => {
  return (
    error: Error | unknown,
    additionalContext?: Record<string, unknown>
  ) => {
    trackError(
      error,
      {
        component,
        action,
        ...additionalContext,
      },
      severity,
      category
    );
  };
};
