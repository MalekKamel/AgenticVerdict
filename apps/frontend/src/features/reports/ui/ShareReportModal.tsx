"use client";

import { useState } from "react";
import {
  Modal,
  Stack,
  Button,
  Group,
  Text,
  Select,
  CopyButton,
  ActionIcon,
  Tooltip,
  Timeline,
  Badge,
  Alert,
  rem,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/api/trpc-client";
import { reportApi } from "../api/report-api";
import { useTenantContext } from "@/lib/tenant-context";
import { showErrorNotification, showSuccessNotification } from "@/lib/notifications";

interface ShareReportModalProps {
  opened: boolean;
  onClose: () => void;
  reportId: string;
  reportName: string;
}

const EXPIRATION_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

export function ShareReportModal({ opened, onClose, reportId, reportName }: ShareReportModalProps) {
  const { tenantId } = useTenantContext();
  const queryClient = useQueryClient();
  const [selectedExpiration, setSelectedExpiration] = useState<string>("24h");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const { data: activeShares } = trpc.report.shares.useQuery(
    { reportId },
    {
      enabled: opened && !!tenantId,
    },
  );

  const createShareMutation = trpc.report.createShareLink.useMutation({
    onSuccess: (data) => {
      setGeneratedUrl(data.shareUrl);
      queryClient.invalidateQueries({ queryKey: reportApi.keys.shares(tenantId!, reportId) });
      showSuccessNotification({ title: "Share link created" });
    },
    onError: (error) => {
      showErrorNotification({ title: "Failed to create share link", message: error.message });
    },
  });

  const revokeShareMutation = trpc.report.revokeShareLink.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportApi.keys.shares(tenantId!, reportId) });
      showSuccessNotification({ title: "Share link revoked" });
    },
    onError: (error) => {
      showErrorNotification({ title: "Failed to revoke share link", message: error.message });
    },
  });

  const handleCreateLink = () => {
    const expiresAt = new Date();
    const expirationMs =
      selectedExpiration === "1h"
        ? 60 * 60 * 1000
        : selectedExpiration === "24h"
          ? 24 * 60 * 60 * 1000
          : selectedExpiration === "7d"
            ? 7 * 24 * 60 * 60 * 1000
            : 30 * 24 * 60 * 60 * 1000;
    expiresAt.setTime(expiresAt.getTime() + expirationMs);
    createShareMutation.mutate({ reportId, expiresAt });
  };

  const handleRevoke = (shareId: string) => {
    revokeShareMutation.mutate({ shareId });
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={`Share: ${reportName}`} size="lg">
      <Stack gap="md">
        {/* Create Share Link */}
        {!generatedUrl ? (
          <Stack gap="sm">
            <Text size="sm">
              Create a shareable link that expires after the selected time period.
            </Text>

            <Select
              label="Expiration"
              data={EXPIRATION_OPTIONS}
              value={selectedExpiration}
              onChange={(value) => value && setSelectedExpiration(value)}
            />

            <Button
              onClick={handleCreateLink}
              loading={createShareMutation.isPending}
              leftSection={<IconCopy size={rem(16)} />}
            >
              Generate Share Link
            </Button>
          </Stack>
        ) : (
          <Alert
            icon={<IconCheck size={rem(16)} />}
            color="green"
            title="Link created successfully"
          >
            <Group gap="xs" mt="sm">
              <Text size="sm" style={{ flex: 1, wordBreak: "break-all" }}>
                {generatedUrl}
              </Text>
              <CopyButton value={generatedUrl}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
                    <ActionIcon
                      color={copied ? "teal" : "gray"}
                      variant="subtle"
                      onClick={copy}
                      aria-label="Copy link"
                    >
                      {copied ? <IconCheck size={rem(16)} /> : <IconCopy size={rem(16)} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Alert>
        )}

        {/* Active Shares */}
        {activeShares && activeShares.shares.length > 0 && (
          <Stack gap="xs">
            <Text fw={500} size="sm">
              Active Shares
            </Text>

            <Timeline active={activeShares.shares.length} bulletSize={24} lineWidth={6}>
              {activeShares.shares.map((share) => (
                <Timeline.Item
                  key={share.id}
                  title={
                    <Group justify="space-between">
                      <Text size="sm">Shared by {share.createdBy}</Text>
                      <Badge size="sm" variant="light">
                        Expires {new Date(share.expiresAt).toLocaleDateString()}
                      </Badge>
                    </Group>
                  }
                  lineVariant={share.revokedAt ? "dashed" : "solid"}
                >
                  <Stack gap="xs">
                    <Text size="xs" c="dimmed">
                      Created {new Date(share.createdAt).toLocaleString()}
                    </Text>
                    {share.revokedAt ? (
                      <Text size="xs" c="red">
                        Revoked
                      </Text>
                    ) : (
                      <Button
                        size="compact-xs"
                        variant="outline"
                        color="red"
                        onClick={() => handleRevoke(share.id)}
                        loading={revokeShareMutation.isPending}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </Stack>
                </Timeline.Item>
              ))}
            </Timeline>
          </Stack>
        )}

        {activeShares && activeShares.shares.length === 0 && !generatedUrl && (
          <Text size="sm" c="dimmed" ta="center">
            No active shares
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
