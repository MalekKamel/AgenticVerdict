/**
 * AuthError — `design-system/molecules/alert.pen` via `@agenticverdict/ui`.
 */

"use client";

import { Alert, Button, Typography } from "@agenticverdict/ui";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslations } from "@/i18n/react";
import { forwardRef, useEffect, useRef } from "react";
import type { AppError } from "@/lib/types/errors";
import {
  getErrorTranslationKey,
  isAuthError,
  isNetworkError,
  isRateLimitError,
  isRetryable,
  isServerError,
} from "@/lib/types/errors";

export interface AuthErrorProps {
  error: AppError | Error | unknown;
  onRetry?: () => void;
  onContactSupport?: () => void;
  className?: string;
  showRetryButton?: boolean;
  showContactSupport?: boolean;
  customMessage?: string;
}

export const AuthError = forwardRef<HTMLDivElement, AuthErrorProps>(
  (
    {
      error,
      onRetry,
      onContactSupport,
      className,
      showRetryButton = true,
      showContactSupport = true,
      customMessage,
    },
    ref,
  ) => {
    const t = useTranslations();
    const internalRef = useRef<HTMLDivElement>(null);
    const errorRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

    let appError: AppError | null = null;
    let errorMessage = customMessage;

    if (error && typeof error === "object" && "type" in error) {
      appError = error as AppError;
      if (!customMessage) {
        const translationKey = getErrorTranslationKey(appError);
        errorMessage = t(translationKey);
      }
    } else if (error instanceof Error) {
      errorMessage = customMessage || error.message;
    } else if (typeof error === "string") {
      errorMessage = customMessage || error;
    } else if (!customMessage) {
      errorMessage = t("errors.common.unknownError");
    }

    useEffect(() => {
      if (errorRef.current && errorMessage) {
        errorRef.current.focus();
        errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, [errorMessage, errorRef]);

    if (!errorMessage) {
      return null;
    }

    const retryable = appError ? isRetryable(appError) : false;
    const shouldShowRetry = showRetryButton && retryable && onRetry;
    const shouldShowContact = showContactSupport && onContactSupport;

    const alertVariant = (() => {
      if (!appError) return "error" as const;
      if (isNetworkError(appError)) return "warning" as const;
      if (isRateLimitError(appError)) return "warning" as const;
      if (isAuthError(appError) || isServerError(appError)) return "error" as const;
      return "error" as const;
    })();

    return (
      <div ref={errorRef} className={className} tabIndex={-1}>
        <Alert
          variant={alertVariant}
          title={t("common.error")}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="flex flex-col gap-3">
            <Typography variant="body-sm" color="danger">
              {errorMessage}
            </Typography>
            {(shouldShowRetry || shouldShowContact) && (
              <div className="flex flex-wrap gap-2">
                {shouldShowRetry ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onRetry}
                    aria-label={t("common.retry")}
                  >
                    {t("common.retry") || t("errors.common.tryAgain")}
                  </Button>
                ) : null}
                {shouldShowContact ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onContactSupport}
                    aria-label={t("common.contactSupport")}
                  >
                    {t("common.contactSupport") || t("errors.common.contactSupport")}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </Alert>
      </div>
    );
  },
);

AuthError.displayName = "AuthError";

export default AuthError;

interface FormErrorProps {
  message: string;
  field?: string;
  className?: string;
}

export function FormError({ message, field, className }: FormErrorProps) {
  return (
    <div
      className={`mt-2 ${className ?? ""}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center gap-2 text-sm text-red-700">
        <IconAlertCircle size={16} aria-hidden="true" />
        <span>
          {field ? <span className="font-semibold">{field}: </span> : null}
          {message}
        </span>
      </div>
    </div>
  );
}

interface InlineErrorProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function InlineError({ id, children, className }: InlineErrorProps) {
  return (
    <p
      id={id}
      className={`mt-1 flex items-center gap-1.5 text-xs text-red-700 ${className ?? ""}`}
      role="alert"
      aria-live="polite"
    >
      <IconAlertCircle size={14} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

interface ErrorSummaryItem {
  field: string;
  message: string;
}

interface ErrorSummaryProps {
  errors: ErrorSummaryItem[];
  title?: string;
  className?: string;
}

export function ErrorSummary({ errors, title, className }: ErrorSummaryProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      className={`mb-4 rounded-lg border border-red-200 bg-red-50 p-4 ${className ?? ""}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {title ? (
        <Typography variant="body-sm" color="danger" className="mb-2 font-medium">
          {title}
        </Typography>
      ) : null}
      <ul className="m-0 list-disc pl-5">
        {errors.map((err, index) => (
          <li key={`${err.field}-${index}`}>
            <Typography variant="body-sm" color="danger" as="span">
              <strong>{err.field}:</strong> {err.message}
            </Typography>
          </li>
        ))}
      </ul>
    </div>
  );
}
