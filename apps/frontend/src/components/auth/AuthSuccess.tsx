/**
 * AuthSuccess — inline alerts from `design-system/molecules/alert.pen` via `@agenticverdict/ui`.
 */

"use client";

import { Alert } from "@agenticverdict/ui";
import { forwardRef, useEffect, useState } from "react";

export interface AuthSuccessProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  autoDismiss?: number;
  className?: string;
}

export const AuthSuccess = forwardRef<HTMLDivElement, AuthSuccessProps>(
  ({ message, title, onDismiss, autoDismiss = 0, className }, ref) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
      if (!message) {
        setVisible(false);
        return;
      }

      setVisible(true);

      if (autoDismiss > 0 && onDismiss) {
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(() => onDismiss(), 200);
        }, autoDismiss);

        return () => clearTimeout(timer);
      }
    }, [message, autoDismiss, onDismiss]);

    if (!message || !visible) {
      return null;
    }

    const handleClose = () => {
      setVisible(false);
      if (onDismiss) {
        setTimeout(() => onDismiss(), 200);
      }
    };

    return (
      <div ref={ref} className={className}>
        <Alert
          variant="success"
          title={title}
          closable={!!onDismiss}
          onClose={onDismiss ? handleClose : undefined}
          role="status"
          aria-live="polite"
        >
          {message}
        </Alert>
      </div>
    );
  },
);

AuthSuccess.displayName = "AuthSuccess";

export default AuthSuccess;
