/**
 * PasswordInput — design-system field aligned with `design-system/atoms/input.pen`
 * via `@agenticverdict/ui` (`Input`, `FormFieldLabel`).
 */

"use client";

import { FormFieldLabel, Input, clsx } from "@agenticverdict/ui";
import { useTranslations } from "@/i18n/react";
import { forwardRef, useId, useState } from "react";
import type { InputProps } from "@agenticverdict/ui";

export interface AppPasswordInputProps extends Omit<InputProps, "type"> {
  /** Field label */
  label?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, AppPasswordInputProps>(
  ({ label, error, id: idProp, required, className, ...props }, ref) => {
    const t = useTranslations("auth.password");
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1">
        {label ? (
          <FormFieldLabel htmlFor={id} required={required}>
            {label}
          </FormFieldLabel>
        ) : null}
        <div className="relative w-full">
          <Input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            state={error ? "error" : "default"}
            error={error}
            className={clsx("pe-12", className)}
            aria-invalid={!!error}
            {...props}
          />
          <button
            type="button"
            className="absolute inset-y-0 end-0 z-10 flex items-center pe-3 text-gray-500 transition-colors hover:text-gray-800"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            tabIndex={-1}
          >
            {visible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width={16}
                height={16}
                aria-hidden
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width={16}
                height={16}
                aria-hidden
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
