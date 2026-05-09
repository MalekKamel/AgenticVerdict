"use client";

import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Flex,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  Tooltip,
  rem,
} from "@mantine/core";
import { IconDownload, IconPrinter, IconX, IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { trpc } from "@/lib/api/trpc-client";
import { ReportViewer } from "@/features/reports/ui/ReportViewer";
import { downloadFromContent } from "@/lib/download";

export default function SharedReportPage() {
  const search = useSearch({ strict: false }) as { reportId?: string; token?: string };
  const reportId = search.reportId;
  const token = search.token;

  const [zoom, setZoom] = useState(100);

  const {
    data: report,
    isLoading,
    error,
  } = trpc.report.getSharedReport.useQuery(
    { reportId: reportId as string, token: token as string },
    {
      enabled: !!reportId && !!token,
    },
  );

  const { data: reportContent } = trpc.report.getSharedReportContent.useQuery(
    { reportId: reportId as string, token: token as string, format: "pdf" },
    {
      enabled: !!reportId && !!token && !!report,
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
          <Title order={3}>Report Not Available</Title>
          <Text c="dimmed">This report may have expired or the link is invalid.</Text>
          <Button component="a" href="/" leftSection={<IconX size={rem(16)} />}>
            Go to Home
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

    downloadFromContent({
      content: reportContent.content,
      contentType: reportContent.contentType,
      fileName: report.title,
      extension: "pdf",
    });
  };

  return (
    <Stack gap="md" p="md" style={{ minHeight: "100vh" }}>
      {/* Viewer Header */}
      <Flex justify="space-between" align="center">
        <Stack gap={0}>
          <Title order={4}>{report.title}</Title>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Generated {new Date(report.createdAt).toLocaleDateString()}
            </Text>
          </Group>
        </Stack>

        <Group>
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
    </Stack>
  );
}
