"use client";

import { Badge, Menu, Tooltip, Group, Text } from "@mantine/core";
import { IconClock, IconCalendarEvent, IconAlertTriangle } from "@tabler/icons-react";
import {
  scheduleService,
  type ScheduleStatus,
} from "@/features/schedules/services/schedule-service";
import type { ScheduleRecord } from "@agenticverdict/types";

export interface ScheduleStatusBadgeProps {
  schedule: ScheduleRecord | null;
  onToggle?: (scheduleId: string) => Promise<void>;
  onViewDetails?: (scheduleId: string) => void;
  size?: "sm" | "md";
}

const statusConfig: Record<
  ScheduleStatus,
  {
    color: string;
    label: string;
    tooltip: string;
    icon: React.ReactNode;
  }
> = {
  scheduled: {
    color: "green",
    label: "Scheduled",
    tooltip: "Automated schedule is active",
    icon: <IconClock size={14} />,
  },
  manual: {
    color: "gray",
    label: "Manual only",
    tooltip: "No automated schedule configured",
    icon: <IconCalendarEvent size={14} />,
  },
  overdue: {
    color: "red",
    label: "Overdue",
    tooltip: "Scheduled run is overdue",
    icon: <IconAlertTriangle size={14} />,
  },
};

export function ScheduleStatusBadge({
  schedule,
  onToggle,
  onViewDetails,
  size = "sm",
}: ScheduleStatusBadgeProps) {
  const status = scheduleService.getScheduleStatus(schedule);
  const config = statusConfig[status];

  const nextRunText = schedule?.nextRunAt
    ? scheduleService.formatNextRun(schedule.nextRunAt, schedule.timezone)
    : null;

  const badgeContent = (
    <Group gap={4} wrap="nowrap">
      {config.icon}
      <Text size={size}>{config.label}</Text>
      {nextRunText && status === "scheduled" && (
        <Text size="xs" c="dimmed">
          {nextRunText}
        </Text>
      )}
    </Group>
  );

  const badge = (
    <Badge
      variant="light"
      color={config.color}
      size={size}
      style={{ cursor: onToggle || onViewDetails ? "pointer" : "default" }}
    >
      {badgeContent}
    </Badge>
  );

  if (!onToggle && !onViewDetails) {
    return (
      <Tooltip label={config.tooltip} withArrow>
        {badge}
      </Tooltip>
    );
  }

  return (
    <Tooltip
      label={
        <Group gap="xs">
          <Text size="sm">{config.tooltip}</Text>
          {nextRunText && (
            <Text size="xs" c="dimmed">
              Next: {nextRunText}
            </Text>
          )}
        </Group>
      }
      withArrow
    >
      <Menu shadow="md" width={200}>
        <Menu.Target>{badge}</Menu.Target>
        <Menu.Dropdown>
          {onViewDetails && schedule && (
            <Menu.Item
              leftSection={<IconCalendarEvent size={14} />}
              onClick={() => onViewDetails(schedule.id)}
            >
              View Schedule
            </Menu.Item>
          )}
          {onToggle && schedule && (
            <Menu.Item
              leftSection={<IconClock size={14} />}
              onClick={() => onToggle(schedule.id)}
              color={schedule.enabled ? "red" : "green"}
            >
              {schedule.enabled ? "Disable Schedule" : "Enable Schedule"}
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </Tooltip>
  );
}
