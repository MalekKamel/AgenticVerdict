"use client";

import { Card, type CardProps } from "@mantine/core";
import type { ReactNode } from "react";

export type AppCardProps = CardProps & { children: ReactNode };

export function AppCard({ children, padding = "lg", withBorder, ...props }: AppCardProps) {
  return (
    <Card padding={padding} withBorder={withBorder ?? true} {...props}>
      {children}
    </Card>
  );
}
