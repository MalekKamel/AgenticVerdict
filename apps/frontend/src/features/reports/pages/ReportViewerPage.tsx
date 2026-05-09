"use client";

import { useParams, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
  rem,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconDownload,
  IconPrinter,
  IconShare,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { trpc } from "@/lib/api/trpc-client";
import { ReportViewer } from "../ui/ReportViewer";
import { ShareReportModal } from "../ui/ShareReportModal";
import { useTenantContext } from "@/lib/tenant-context";
import { showSuccessNotification } from "@/lib/notifications";
import { downloadFromContent, detectFormatFromMetadata } from "@/lib/download";
import { FORMAT_EXTENSIONS } from "@/lib/download/types";

export default function ReportViewerPage() {
  const params = useParams({ strict: false });
  const router = useRouter();
  const { tenantId } = useTenantContext();
  const reportId = (params as { reportId?: string }).reportId;

  const [zoom, setZoom] = useState(100);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);
  const [shareModalOpened, setShareModalOpened] = useState(false);

  const {
    data: report,
    isLoading,
    error,
  } = trpc.report.detail.useQuery(
    { id: reportId! },
    {
      enabled: !!tenantId && !!reportId,
    },
  );

  const { data: reportContent } = trpc.report.content.useQuery(
    { id: reportId!, format: (selectedVersion as "pdf" | "excel") || "pdf" },
    {
      enabled: !!tenantId && !!reportId && !!report,
    },
  );

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !report) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Text c="dimmed">Failed to load report</Text>
          <Button
            onClick={() => router.history.back()}
            leftSection={<IconArrowLeft size={rem(16)} />}
          >
            Go Back
          </Button>
        </Stack>
      </Center>
    );
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handlePrint = () => window.print();
  const handleDownload = () => {
    if (!reportContent?.content) return;

    const format = detectFormatFromMetadata(report.metadata);
    downloadFromContent({
      content: reportContent.content,
      contentType: reportContent.contentType,
      fileName: report.title,
      extension: FORMAT_EXTENSIONS[format],
    });

    showSuccessNotification({ title: "Download started" });
  };

  const versionOptions: { value: string; label: string }[] = [];

  return (
    <Stack gap="md" p="md">
      {/* Viewer Header */}
      <Flex justify="space-between" align="center">
        <Group>
          <ActionIcon variant="subtle" onClick={() => router.history.back()} aria-label="Go back">
            <IconArrowLeft size={rem(20)} />
          </ActionIcon>
          <Stack gap={0}>
            <Title order={4}>{report.title}</Title>
            <Group gap="xs">
              <Badge size="sm" variant="light">
                {report.status}
              </Badge>
              <Text size="sm" c="dimmed">
                Generated {new Date(report.createdAt).toLocaleDateString()}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Group>
          {versionOptions.length > 1 && (
            <Select
              label="Version"
              data={versionOptions}
              value={selectedVersion}
              onChange={(value) => setSelectedVersion(value ?? undefined)}
              size="xs"
              style={{ width: 200 }}
            />
          )}

          <Tooltip label="Zoom out">
            <ActionIcon
              variant="subtle"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              aria-label="Zoom out"
            >
              <IconZoomOut size={rem(18)} />
            </ActionIcon>
          </Tooltip>

          <Text size="sm" w={60} ta="center">
            {zoom}%
          </Text>

          <Tooltip label="Zoom in">
            <ActionIcon
              variant="subtle"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              aria-label="Zoom in"
            >
              <IconZoomIn size={rem(18)} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Print">
            <ActionIcon variant="subtle" onClick={handlePrint} aria-label="Print">
              <IconPrinter size={rem(18)} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Download">
            <ActionIcon variant="subtle" onClick={handleDownload} aria-label="Download">
              <IconDownload size={rem(18)} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Share">
            <ActionIcon
              variant="subtle"
              onClick={() => setShareModalOpened(true)}
              aria-label="Share"
            >
              <IconShare size={rem(18)} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Flex>

      {/* Report Viewer */}
      <Box style={{ flex: 1, minHeight: 0 }}>
        {reportContent ? (
          <ReportViewer content={reportContent} zoom={zoom} reportFormat="pdf" />
        ) : (
          <Center h={400}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Loading report content...</Text>
            </Stack>
          </Center>
        )}
      </Box>

      {reportId && (
        <ShareReportModal
          opened={shareModalOpened}
          onClose={() => setShareModalOpened(false)}
          reportId={reportId}
          reportName={report.title}
        />
      )}
    </Stack>
  );
}
