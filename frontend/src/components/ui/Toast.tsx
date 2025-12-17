import * as ToastPrimitive from '@radix-ui/react-toast';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastContent {
  title?: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (opts: {
    title?: string;
    message: string;
    variant?: ToastVariant;
  }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ToastContent>({
    title: undefined,
    message: '',
    variant: 'info',
  });

  const showToast = useCallback(
    ({
      title,
      message,
      variant = 'info',
    }: {
      title?: string;
      message: string;
      variant?: ToastVariant;
    }) => {
      setContent({ title, message, variant });
      // Close then reopen to allow same message to be shown consecutively
      setOpen(false);
      setTimeout(() => setOpen(true), 10);
    },
    []
  );

  const getAccentClasses = (variant: ToastVariant): string => {
    switch (variant) {
      case 'success':
        return 'border-emerald-500 bg-emerald-500/10 text-emerald-100';
      case 'error':
        return 'border-red-500 bg-red-500/10 text-red-100';
      case 'warning':
        return 'border-amber-400 bg-amber-500/10 text-amber-100';
      case 'info':
      default:
        return 'border-sky-500 bg-sky-500/10 text-sky-100';
    }
  };

  const getIcon = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        <ToastPrimitive.Root
          open={open}
          onOpenChange={setOpen}
          className="fixed bottom-4 right-4 z-50 w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-xl bg-slate-950/95 shadow-2xl border border-slate-800 backdrop-blur">
            {/* Colored accent bar */}
            <div
              className={`absolute inset-y-0 left-0 w-1 ${getAccentClasses(
                content.variant
              )}`}
            />

            <div className="flex items-start gap-3 px-4 py-3 pl-5">
              {/* Icon bubble */}
              <div
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border ${getAccentClasses(
                  content.variant
                )}`}
              >
                {getIcon(content.variant)}
              </div>

              <div className="flex-1 text-sm text-slate-100">
                {content.title && (
                  <ToastPrimitive.Title className="font-semibold mb-0.5">
                    {content.title}
                  </ToastPrimitive.Title>
                )}
                <ToastPrimitive.Description className="text-xs sm:text-sm text-slate-300">
                  {content.message}
                </ToastPrimitive.Description>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-2 mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </ToastPrimitive.Root>

        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 flex flex-col gap-2 p-4 z-50 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};
