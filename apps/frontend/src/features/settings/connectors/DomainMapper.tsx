"use client";

import { useState, useMemo } from "react";
import {
  Container,
  Stack,
  Title,
  Group,
  Paper,
  Text,
  Box,
  Alert,
  Badge,
  ScrollArea,
  TextInput,
  ActionIcon,
  Divider,
  Button,
} from "@mantine/core";
import {
  IconSearch,
  IconAlertCircle,
  IconFolder,
  IconPlug,
  IconArrowRight,
  IconDeviceFloppy,
} from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import { useAiDomains, useMapConnector, useUnmapConnector } from "@/hooks/useAiDomains";
import {
  showErrorNotification,
  showInfoNotification,
  showSuccessNotification,
} from "@/lib/notifications";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import type { BusinessDomain, Connector } from "@agenticverdict/types";

interface DraggableConnectorProps {
  connector: Connector;
  onDragStart?: (connectorId: string) => void;
}

function DraggableConnector({ connector, onDragStart }: DraggableConnectorProps) {
  const t = useTranslations("components.domainMapper");

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("connectorId", connector.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(connector.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "inactive":
        return "gray";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <Box
      draggable
      onDragStart={handleDragStart}
      p="sm"
      mb="xs"
      style={{
        background: "white",
        border: "1px solid #e9ecef",
        borderRadius: 6,
        cursor: "grab",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = "#228be6";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e9ecef";
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <IconPlug size={16} color="#666" />
            <Text fw={600} size="sm">
              {connector.name}
            </Text>
          </Group>
          <Badge size="xs" color={getStatusColor(connector.status)} variant="light">
            {t(`connectorStatus.${connector.status}`)}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {connector.type}
        </Text>
        {connector.lastSyncedAt && (
          <Text size="xs" c="dimmed">
            {t("lastSynced")}: {new Date(connector.lastSyncedAt).toLocaleDateString()}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

interface DroppableDomainProps {
  domain: BusinessDomain;
  connectors: Connector[];
  onDrop?: (domainId: string, connectorId: string) => void;
  onRemoveConnector?: (domainId: string, connectorId: string) => void;
}

function DroppableDomain({ domain, connectors, onDrop, onRemoveConnector }: DroppableDomainProps) {
  const t = useTranslations("components.domainMapper");
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const connectorId = e.dataTransfer.getData("connectorId");
    if (connectorId && onDrop) {
      onDrop(domain.id, connectorId);
    }
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      p="md"
      mb="md"
      style={{
        background: isOver ? "#e7f5ff" : "white",
        border: isOver ? "2px dashed #228be6" : "1px solid #e9ecef",
        borderRadius: 8,
        transition: "all 0.2s",
        minHeight: 120,
      }}
    >
      <Stack gap="sm">
        {/* Domain Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <IconFolder size={20} color="#666" />
            <Text fw={600}>{domain.name}</Text>
            <Badge size="xs" variant="outline">
              {connectors.length} {t("connectors")}
            </Badge>
          </Group>
        </Group>

        {domain.description && (
          <Text size="sm" c="dimmed">
            {domain.description}
          </Text>
        )}

        <Divider />

        {/* Connectors Drop Zone */}
        {connectors.length > 0 ? (
          <Stack gap="xs">
            {connectors.map((connector) => (
              <Group
                key={connector.id}
                justify="space-between"
                p="xs"
                style={{ background: "#f8f9fa", borderRadius: 4 }}
              >
                <Group gap="xs">
                  <IconPlug size={14} color="#666" />
                  <Text size="sm">{connector.name}</Text>
                </Group>
                {onRemoveConnector && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={() => onRemoveConnector(domain.id, connector.id)}
                  >
                    <IconAlertCircle size={14} />
                  </ActionIcon>
                )}
              </Group>
            ))}
          </Stack>
        ) : (
          <Box
            py="xl"
            style={{
              textAlign: "center",
              color: "#adb5bd",
              border: "2px dashed #dee2e6",
              borderRadius: 6,
            }}
          >
            <IconPlug size={32} style={{ marginBottom: 8 }} />
            <Text size="sm">{t("dropConnector")}</Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

export function DomainMapper() {
  const t = useTranslations("settings.domainMapper");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingChanges, setPendingChanges] = useState<
    Array<{ domainId: string; connectorId: string; action: "assign" | "remove" }>
  >([]);

  useAppShellHeader({
    breadcrumbs: [
      { label: t("common.settings"), href: ROUTE_PATHS.SETTINGS_DOMAINS },
      { label: t("pageTitle") },
    ],
  });

  const { data: domains = [], isLoading } = useAiDomains();
  const mapConnectorMutation = useMapConnector();
  const unmapConnectorMutation = useUnmapConnector();

  // Mock connectors - in real implementation, this would come from a hook
  const connectors: Connector[] = useMemo(
    () => [
      // This would be fetched from useConnectors hook
    ],
    [],
  );

  const filteredConnectors = connectors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.platform?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()),
  );

  const unassignedConnectors = connectors.filter((c) => !c.domainId);

  const handleAssignConnector = (domainId: string, connectorId: string) => {
    setPendingChanges((prev) => [...prev, { domainId, connectorId, action: "assign" }]);
  };

  const handleRemoveConnector = (domainId: string, connectorId: string) => {
    setPendingChanges((prev) => [...prev, { domainId, connectorId, action: "remove" }]);
  };

  const handleSave = async () => {
    if (pendingChanges.length === 0) {
      showInfoNotification({
        title: t("actions.save"),
        message: t("pendingChanges", { count: 0 }),
      });
      return;
    }

    try {
      await Promise.all(
        pendingChanges.map(async (change) => {
          if (change.action === "assign") {
            await mapConnectorMutation.mutateAsync({
              domainId: change.domainId,
              connectorId: change.connectorId,
            });
            return;
          }

          await unmapConnectorMutation.mutateAsync({
            connectorId: change.connectorId,
          });
        }),
      );
      setPendingChanges([]);
      showSuccessNotification({
        title: t("actions.save"),
        message: t("pendingChanges", { count: 0 }),
      });
    } catch {
      showErrorNotification({
        title: t("messages.error"),
      });
    }
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Text c="dimmed">{t("loading")}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Title order={2}>{t("pageTitle")}</Title>
          <Button
            leftSection={<IconDeviceFloppy size={18} />}
            onClick={handleSave}
            disabled={pendingChanges.length === 0}
          >
            {t("actions.save")} ({pendingChanges.length})
          </Button>
        </Group>

        {/* Info Alert */}
        <Alert icon={<IconAlertCircle size={20} />} color="blue">
          {t("info")}
        </Alert>

        {/* Two-Column Layout */}
        <Group align="flex-start" gap="xl">
          {/* Left Column: Available Connectors */}
          <Paper p="md" withBorder style={{ flex: 1, minWidth: 300 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>{t("availableConnectors")}</Text>
                <Badge variant="outline">{unassignedConnectors.length}</Badge>
              </Group>

              <TextInput
                placeholder={t("filters.search")}
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
              />

              <ScrollArea.Autosize mah={600}>
                <Stack gap="xs">
                  {filteredConnectors.length > 0 ? (
                    filteredConnectors.map((connector) => (
                      <DraggableConnector key={connector.id} connector={connector} />
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" py="xl">
                      {t("noConnectors")}
                    </Text>
                  )}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          </Paper>

          {/* Arrow Icon */}
          <Box style={{ paddingTop: 40 }}>
            <IconArrowRight size={32} color="#adb5bd" />
          </Box>

          {/* Right Column: Domains */}
          <Paper p="md" withBorder style={{ flex: 1, minWidth: 400 }}>
            <Stack gap="md">
              <Text fw={600}>{t("businessDomains")}</Text>

              <ScrollArea.Autosize mah={600}>
                <Stack gap="sm">
                  {domains.map((domain: BusinessDomain) => (
                    <DroppableDomain
                      key={domain.id}
                      domain={domain}
                      connectors={connectors.filter((c: Connector) => c.domainId === domain.id)}
                      onDrop={handleAssignConnector}
                      onRemoveConnector={handleRemoveConnector}
                    />
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          </Paper>
        </Group>

        {/* Pending Changes Summary */}
        {pendingChanges.length > 0 && (
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="yellow"
            title={t("pendingChanges", { count: pendingChanges.length })}
          >
            <Stack gap="xs">
              {pendingChanges.map((change, index) => (
                <Text key={index} size="sm">
                  {change.action === "assign" ? t("changes.assign") : t("changes.remove")}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
