import { Badge, Loader, Group, Text } from "@mantine/core";
import { IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react";
import type { PipelineExecutionStatus } from "@agenticverdict/types";

interface JobStatusBadgeProps {
  status: PipelineExecutionStatus | null;
  progress: number;
  error?: string | null;
  onRetry?: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon?: React.ReactNode }> = {
  waiting: { color: "gray", label: "Waiting" },
  active: { color: "blue", label: "Running" },
  completed: { color: "green", label: "Completed", icon: <IconCheck size={14} /> },
  failed: { color: "red", label: "Failed", icon: <IconX size={14} /> },
  degraded: { color: "orange", label: "Degraded", icon: <IconAlertTriangle size={14} /> },
  delayed: { color: "yellow", label: "Delayed" },
  paused: { color: "gray", label: "Paused" },
};

export function JobStatusBadge({ status, progress, error, onRetry }: JobStatusBadgeProps) {
  if (!status) {
    return null;
  }

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.waiting;

  if (status === "active" || status === "waiting") {
    return (
      <Group gap="xs">
        <Loader size="xs" color={config.color} />
        <Text size="sm" c="dimmed">
          {config.label}... {progress > 0 ? `(${progress}%)` : ""}
        </Text>
      </Group>
    );
  }

  if (status === "failed") {
    return (
      <Group gap="xs">
        <Badge color="red" leftSection={config.icon}>
          {config.label}
        </Badge>
        {error && (
          <Text size="xs" c="red">
            {error}
          </Text>
        )}
        {onRetry && (
          <Text
            size="xs"
            c="blue"
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={onRetry}
          >
            Retry
          </Text>
        )}
      </Group>
    );
  }

  return (
    <Badge color={config.color} leftSection={config.icon}>
      {config.label}
    </Badge>
  );
}
