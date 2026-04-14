/**
 * AuthSuccess — success surface from `authentication.pen` (`Auth/Alert` success) via {@link AuthPenAlert}.
 */

"use client";

import { AuthPenAlert, AuthPenButton } from "@/components/auth/pen";
import { useTranslations } from "@/i18n/react";
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
    const t = useTranslations("common");
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
        <AuthPenAlert variant="success" title={title} className="max-w-none">
          {message}
        </AuthPenAlert>
        {onDismiss ? (
          <div className="mt-2 flex justify-end">
            <AuthPenButton type="button" variant="ghost" size="sm" onClick={handleClose}>
              {t("close")}
            </AuthPenButton>
          </div>
        ) : null}
      </div>
    );
  },
);

AuthSuccess.displayName = "AuthSuccess";

export default AuthSuccess;
