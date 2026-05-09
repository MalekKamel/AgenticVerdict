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
  IconSparkles,
  IconPlus,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { trpc } from "@/lib/api/trpc-client";
import {
  AuditEventType,
  AUDIT_EVENT_TYPE_LABELS,
  type AuditTrailEvent,
} from "@agenticverdict/types";

interface AuditTrailTimelineProps {
  insightId: string;
}

const EVENT_TYPE_ICONS: Record<AuditEventType, typeof IconCheck> = {
  [AuditEventType.RUN]: IconPlayerPlay,
  [AuditEventType.CONFIG_CHANGE]: IconSettings,
  [AuditEventType.DELIVERY]: IconMail,
  [AuditEventType.ERROR]: IconAlertCircle,
  [AuditEventType.AI_GENERATED]: IconSparkles,
  [AuditEventType.CREATED]: IconPlus,
  [AuditEventType.UPDATED]: IconPencil,
  [AuditEventType.DELETED]: IconTrash,
};

export function AuditTrailTimeline({ insightId }: AuditTrailTimelineProps) {
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);

  const { data, isLoading } = trpc.insight.getAuditTrail.useQuery(
    { insightId },
    {
      enabled: !!insightId,
    },
  );

  const events = data?.events;

  const filteredEvents = events?.filter((event) => {
    if (eventTypeFilter && event.eventType !== eventTypeFilter) return false;
    return true;
  });

  const getEventIcon = (eventType: string, status: string) => {
    if (status === "failed") return IconAlertCircle;
    if (status === "success") return EVENT_TYPE_ICONS[eventType as AuditEventType] ?? IconCheck;
    return EVENT_TYPE_ICONS[eventType as AuditEventType] ?? IconAlertCircle;
  };

  const renderEventDetails = (event: AuditTrailEvent) => {
    switch (event.eventType) {
      case AuditEventType.RUN:
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

      case AuditEventType.CONFIG_CHANGE: {
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

      case AuditEventType.DELIVERY: {
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

      case AuditEventType.ERROR:
        return (
          <Text size="sm" c="red">
            {typeof event.metadata?.errorMessage === "string"
              ? event.metadata.errorMessage
              : "Unknown error"}
          </Text>
        );

      case AuditEventType.AI_GENERATED:
        return (
          <Stack gap="xs">
            <Text size="sm">AI insights generated</Text>
            {(() => {
              const reportId = (event.metadata as Record<string, unknown>)?.reportId as
                | string
                | undefined;
              if (reportId) {
                return (
                  <Text size="sm">
                    Report: <Code>{reportId}</Code>
                  </Text>
                );
              }
              return null;
            })()}
          </Stack>
        );

      default:
        return (
          <Text size="sm" c="dimmed">
            {AUDIT_EVENT_TYPE_LABELS[event.eventType as AuditEventType] ?? event.eventType}
          </Text>
        );
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
            data={Object.entries(AUDIT_EVENT_TYPE_LABELS).map(([value, label]) => ({
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
                      {AUDIT_EVENT_TYPE_LABELS[event.eventType as AuditEventType] ??
                        event.eventType}
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
