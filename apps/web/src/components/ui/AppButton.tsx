"use client";

import { Button, type ButtonProps } from "@mantine/core";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AppButtonProps = ButtonProps &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    children: ReactNode;
  };

/** Primary action button — thin Mantine wrapper for shared defaults. */
export function AppButton({ children, radius = "md", type = "button", ...props }: AppButtonProps) {
  return (
    <Button radius={radius} type={type} {...props}>
      {children}
    </Button>
  );
}
