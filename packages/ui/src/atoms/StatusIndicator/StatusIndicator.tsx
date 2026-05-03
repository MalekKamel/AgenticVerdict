import { Badge, type BadgeProps } from "@mantine/core";

export type StatusVariant = "healthy" | "warning" | "error" | "inactive";

export interface StatusIndicatorProps extends Omit<BadgeProps, "color" | "variant"> {
  variant?: StatusVariant;
  label?: string;
}

const statusColorMap: Record<StatusVariant, string> = {
  healthy: "green",
  warning: "yellow",
  error: "red",
  inactive: "gray",
};

const statusLabelMap: Record<StatusVariant, string> = {
  healthy: "Healthy",
  warning: "Warning",
  error: "Error",
  inactive: "Inactive",
};

export function StatusIndicator({ variant = "inactive", label, ...props }: StatusIndicatorProps) {
  return (
    <Badge color={statusColorMap[variant]} variant="filled" size="sm" {...props}>
      {label ?? statusLabelMap[variant]}
    </Badge>
  );
}
