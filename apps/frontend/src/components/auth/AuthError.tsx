/**
 * AuthError — Mantine `Alert`, `Button`, `Text` for structured error handling.
 */

"use client";

import { Alert, Button, Group, List, Text } from "@mantine/core";
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

    const alertColor = (() => {
      if (!appError) return "red" as const;
      if (isNetworkError(appError)) return "yellow" as const;
      if (isRateLimitError(appError)) return "yellow" as const;
      if (isAuthError(appError) || isServerError(appError)) return "red" as const;
      return "red" as const;
    })();

    return (
      <div ref={errorRef} className={className} tabIndex={-1}>
        <Alert
          color={alertColor}
          title={t("common.error")}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          variant="light"
          icon={<IconAlertCircle size={20} aria-hidden />}
        >
          <Text size="sm" c="red" component="div">
            {errorMessage}
          </Text>
          {shouldShowRetry || shouldShowContact ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {shouldShowRetry ? (
                <Button variant="light" size="xs" onClick={onRetry} aria-label={t("common.retry")}>
                  {t("common.retry") || t("errors.common.tryAgain")}
                </Button>
              ) : null}
              {shouldShowContact ? (
                <Button
                  variant="transparent"
                  size="xs"
                  onClick={onContactSupport}
                  aria-label={t("common.contactSupport")}
                >
                  {t("common.contactSupport") || t("errors.common.contactSupport")}
                </Button>
              ) : null}
            </div>
          ) : null}
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
    <Group className={className} gap="xs" role="alert" aria-live="assertive" aria-atomic="true">
      <IconAlertCircle size={16} aria-hidden="true" />
      <Text size="sm" c="red">
        {field ? <span className="font-semibold">{field}: </span> : null}
        {message}
      </Text>
    </Group>
  );
}

interface InlineErrorProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function InlineError({ id, children, className }: InlineErrorProps) {
  return (
    <Group id={id} className={className} gap={6} role="alert" aria-live="polite">
      <IconAlertCircle size={14} aria-hidden="true" />
      <Text size="xs" c="red" component="span">
        {children}
      </Text>
    </Group>
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
    <Alert
      className={className}
      color="red"
      title={title}
      variant="light"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <List listStyleType="disc" m={0} p={0} size="sm" c="red" withPadding>
        {errors.map((err, index) => (
          <List.Item key={`${err.field}-${index}`}>
            <Text size="sm" c="red" component="span">
              <strong>{err.field}:</strong> {err.message}
            </Text>
          </List.Item>
        ))}
      </List>
    </Alert>
  );
}
