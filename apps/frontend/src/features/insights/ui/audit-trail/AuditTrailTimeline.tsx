"use client";

import { useState } from "react";
import {
  Timeline,
  Group,
  Text,
  Badge,
  Stack,
  Select,
  Grid,
  Code,
  ScrollArea,
  Skeleton,
  Box,
  rem,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconSettings,
  IconMail,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";
import { useTenantContext } from "@/lib/tenant-context";
import { trpc } from "@/lib/api/trpc-client";

export interface AuditTrailEvent {
  id: string;
  insightId: string;
  eventType: "run" | "config_change" | "delivery" | "error";
  status: "success" | "failed" | "pending";
  timestamp: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface AuditTrailTimelineProps {
  insightId: string;
}

const EVENT_TYPE_LABELS = {
  run: "Report Run",
  config_change: "Configuration Change",
  delivery: "Delivery",
  error: "Error",
};

export function AuditTrailTimeline({ insightId }: AuditTrailTimelineProps) {
  const { tenantId } = useTenantContext();
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);

  const { data, isLoading } = trpc.insight.getAuditTrail.useQuery(
    { tenantId: tenantId!, insightId },
    {
      enabled: !!tenantId && !!insightId,
    },
  );

  const events = data?.events;

  const filteredEvents = events?.filter((event) => {
    if (eventTypeFilter && event.eventType !== eventTypeFilter) return false;
    return true;
  });

  const getEventIcon = (eventType: string, status: string) => {
    if (status === "failed") return IconAlertCircle;
    if (status === "success") return IconCheck;

    switch (eventType) {
      case "run":
        return IconPlayerPlay;
      case "config_change":
        return IconSettings;
      case "delivery":
        return IconMail;
      case "error":
        return IconAlertCircle;
      default:
        return IconAlertCircle;
    }
  };

  const renderEventDetails = (event: AuditTrailEvent) => {
    switch (event.eventType) {
      case "run":
        return (
          <Stack gap="xs">
            <Group gap="xs">
              <Text size="sm">
                Duration: <strong>{event.duration ? `${event.duration}ms` : "N/A"}</strong>
              </Text>
              <Text size="sm">
                Report ID: <Code>{(event.metadata?.reportId as string) || "N/A"}</Code>
              </Text>
            </Group>
          </Stack>
        );

      case "config_change": {
        const changes = event.metadata?.changes as Record<string, unknown> | undefined;
        return (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Configuration updated
            </Text>
            {changes && typeof changes === "object" && (
              <Box>
                <Text size="xs" fw={500} mb="xs">
                  Changes:
                </Text>
                <ScrollArea.Autosize mah={200}>
                  <pre style={{ fontSize: "12px", margin: 0 }}>
                    {JSON.stringify(changes, null, 2)}
                  </pre>
                </ScrollArea.Autosize>
              </Box>
            )}
          </Stack>
        );
      }

      case "delivery": {
        const recipient = event.metadata?.recipient as string | undefined;
        const webhookUrl = event.metadata?.webhookUrl as string | undefined;
        return (
          <Stack gap="xs">
            <Group gap="xs">
              <Text size="sm">
                Method:{" "}
                <strong>{event.metadata?.method === "webhook" ? "Webhook" : "Email"}</strong>
              </Text>
              {recipient && (
                <Text size="sm">
                  Recipient: <Code>{recipient}</Code>
                </Text>
              )}
              {webhookUrl && (
                <Text size="sm">
                  Webhook: <Code>{webhookUrl}</Code>
                </Text>
              )}
            </Group>
          </Stack>
        );
      }

      case "error":
        return (
          <Text size="sm" c="red">
            {typeof event.metadata?.errorMessage === "string"
              ? event.metadata.errorMessage
              : "Unknown error"}
          </Text>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Stack gap="md">
        <Skeleton height={40} />
        <Skeleton height={40} />
        <Skeleton height={40} />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Filters */}
      <Grid>
        <Grid.Col span={12}>
          <Select
            label="Event Type"
            placeholder="All events"
            data={Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            value={eventTypeFilter}
            onChange={setEventTypeFilter}
            clearable
            size="sm"
          />
        </Grid.Col>
      </Grid>

      {/* Timeline */}
      {filteredEvents && filteredEvents.length > 0 ? (
        <Timeline active={filteredEvents.length} bulletSize={24} lineWidth={6}>
          {filteredEvents.map((event) => {
            const Icon = getEventIcon(event.eventType, event.status);
            return (
              <Timeline.Item
                key={event.id}
                title={
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {EVENT_TYPE_LABELS[event.eventType as keyof typeof EVENT_TYPE_LABELS]}
                    </Text>
                    <Badge
                      size="sm"
                      color={
                        event.status === "success"
                          ? "green"
                          : event.status === "failed"
                            ? "red"
                            : "gray"
                      }
                      variant="light"
                    >
                      {event.status}
                    </Badge>
                  </Group>
                }
                bullet={<Icon size={rem(14)} />}
                lineVariant={event.status === "failed" ? "dashed" : "solid"}
              >
                <Stack gap="xs">
                  <Text size="xs" c="dimmed">
                    {new Date(event.timestamp).toLocaleString()}
                  </Text>
                  {renderEventDetails(event as AuditTrailEvent)}
                </Stack>
              </Timeline.Item>
            );
          })}
        </Timeline>
      ) : (
        <Text ta="center" c="dimmed" py="xl">
          No audit trail events found
        </Text>
      )}
    </Stack>
  );
}
