"use client";

import { useState } from "react";
import {
  Container,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Button,
  Tabs,
  Card,
  SimpleGrid,
  Skeleton,
  ActionIcon,
  Divider,
  Alert,
  Table,
  Pagination,
  TextInput,
  Modal,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconPlayerPlay,
  IconSettings,
  IconTrash,
  IconReport,
  IconClock,
  IconAlertCircle,
  IconDownload,
  IconShare,
  IconEye,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useParams, useNavigate } from "@/router/hooks";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import {
  useInsightDetail,
  useInsightDelete,
  useAIInsights,
  useGenerateAIInsights,
  useTenantConfig,
} from "@/features/insights/api/insight-api";
import { useInsightRunMutation } from "@/features/insights/hooks";
import { PageErrorBoundary } from "@/components/error-boundaries";
import { useReportList } from "@/features/reports/api/report-api";
import { trpc } from "@/lib/api/trpc-client";
import { downloadReport, bulkDownloadReports } from "@/lib/download";
import { showSuccessNotification } from "@/lib/notifications";
import type { ReportListItem, InsightOutput } from "@agenticverdict/types";
import { AuditTrailTimeline } from "../ui/audit-trail/AuditTrailTimeline";
import { JobStatusBadge } from "../ui/common/JobStatusBadge";
import { ScheduleStatusBadge } from "@/features/shared/ui/ScheduleStatusBadge";
import { scheduleService } from "@/features/schedules/services/schedule-service";

function PageHeader({
  insight,
  onBack,
  onEdit,
  onRunNow,
  onDelete,
  isRunning,
}: {
  insight: InsightOutput;
  onBack: () => void;
  onEdit: () => void;
  onRunNow: () => void;
  onDelete: () => void;
  isRunning: boolean;
}) {
  const t = useTranslations("insights");

  const handleDeleteClick = () => {
    if (confirm(t("list.actions.deleteConfirm"))) {
      onDelete();
    }
  };

  return (
    <Group justify="space-between">
      <Group gap="xs">
        <ActionIcon variant="subtle" onClick={onBack}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Stack gap={2}>
          <Title order={1}>{insight.name}</Title>
          <Group gap="xs">
            <Badge variant={insight.enabled ? "success" : "default"}>
              {t(`status.${insight.enabled ? "enabled" : "disabled"}`)}
            </Badge>
            <Text size="sm" c="dimmed">
              {t("detail.created")} {new Date(insight.createdAt).toLocaleDateString()}
            </Text>
          </Group>
        </Stack>
      </Group>
      <Group gap="xs">
        <Button
          variant="outline"
          leftSection={<IconPlayerPlay size={16} />}
          onClick={onRunNow}
          loading={isRunning}
        >
          {t("detail.runNow")}
        </Button>
        <Button variant="outline" leftSection={<IconSettings size={16} />} onClick={onEdit}>
          {t("detail.edit")}
        </Button>
        <ActionIcon variant="outline" color="red" onClick={handleDeleteClick}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Group>
  );
}

function ConfigurationSummary({ insight }: { insight: InsightOutput }) {
  const t = useTranslations("insights");

  const connectorCount = insight.connectors.length;
  const metricCount = insight.connectors.reduce(
    (acc: number, c: { selectedMetrics?: unknown[] }) => acc + (c.selectedMetrics?.length || 0),
    0,
  );

  return (
    <Card withBorder>
      <Stack gap="md">
        <Title order={3}>{t("detail.overview.configTitle")}</Title>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              {t("detail.overview.description")}
            </Text>
            <Text>{insight.description || t("detail.overview.noDescription")}</Text>
          </Stack>
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              {t("detail.overview.connectors")}
            </Text>
            <Text>
              {connectorCount} {t("detail.overview.connectorsLabel")}
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              {t("detail.overview.metrics")}
            </Text>
            <Text>
              {metricCount} {t("detail.overview.metricsLabel")}
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              {t("detail.overview.aiModel")}
            </Text>
            <Text>
              {(insight.aiConfig as { model?: string })?.model || t("detail.overview.defaultModel")}
            </Text>
          </Stack>
        </SimpleGrid>
        {insight.connectors.length > 0 && (
          <>
            <Divider />
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                {t("detail.overview.connectedDomains")}
              </Text>
              <Group gap="xs">
                {insight.connectors.map(
                  (c: { id: string; connectorId: string; enabled?: boolean }) => (
                    <Badge
                      key={c.id}
                      size="sm"
                      variant="outline"
                      leftSection={
                        c.enabled !== false ? <IconCheck size={12} /> : <IconX size={12} />
                      }
                    >
                      {c.connectorId}
                    </Badge>
                  ),
                )}
              </Group>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}

function ReportTableSkeleton() {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            <Skeleton height={20} />
          </Table.Th>
          <Table.Th>
            <Skeleton height={20} />
          </Table.Th>
          <Table.Th>
            <Skeleton height={20} />
          </Table.Th>
          <Table.Th>
            <Skeleton height={20} />
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {[...Array(5)].map((_, i) => (
          <Table.Tr key={i}>
            <Table.Td>
              <Skeleton height={20} />
            </Table.Td>
            <Table.Td>
              <Skeleton height={20} />
            </Table.Td>
            <Table.Td>
              <Skeleton height={20} />
            </Table.Td>
            <Table.Td>
              <Skeleton height={20} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function RecentReports({
  insightId,
  onViewReport,
  onDownloadReport,
  onShareReport,
}: {
  insightId: string;
  onViewReport: (reportId: string) => void;
  onDownloadReport: (report: ReportListItem) => void;
  onShareReport: (report: ReportListItem) => void;
}) {
  const t = useTranslations("insights");
  const { data, isLoading, error } = useReportList({
    page: 1,
    pageSize: 5,
    insightId,
  });

  if (isLoading) {
    return (
      <Stack gap="xs">
        {[1, 2, 3].map((i) => (
          <Card key={i} withBorder p="md">
            <Stack gap={2}>
              <Skeleton height={20} width={150} />
              <Skeleton height={16} width={100} />
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
        {t("detail.overview.reportsError")}
      </Alert>
    );
  }

  const reports = data?.reports || [];

  if (reports.length === 0) {
    return (
      <Alert variant="light" color="blue" icon={<IconAlertCircle size={16} />}>
        {t("detail.overview.noReportsYet")}
      </Alert>
    );
  }

  return (
    <Stack gap="xs">
      {reports.slice(0, 5).map((report: ReportListItem) => (
        <Card key={report.id} withBorder p="md">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={500}>{report.title}</Text>
              <Text size="sm" c="dimmed">
                {new Date(report.createdAt).toLocaleDateString()}
              </Text>
            </Stack>
            <Group gap="xs">
              <Button
                variant="outline"
                size="sm"
                leftSection={<IconEye size={14} />}
                onClick={() => onViewReport(report.id)}
              >
                {t("detail.overview.view")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftSection={<IconDownload size={14} />}
                onClick={() => onDownloadReport(report)}
              >
                {t("detail.overview.download")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftSection={<IconShare size={14} />}
                onClick={() => onShareReport(report)}
              >
                {t("detail.overview.share")}
              </Button>
            </Group>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

function AIInsightsCard({ insight }: { insight: InsightOutput }) {
  const t = useTranslations("insights");
  const { data: aiInsights, isLoading, error, refetch } = useAIInsights(insight.id);
  const generateMutation = useGenerateAIInsights();
  const isGenerating = generateMutation.isPending;

  const { data: reportsData } = useReportList({
    page: 1,
    pageSize: 1,
    insightId: insight.id,
  });
  const latestReportId = reportsData?.reports?.[0]?.id;

  const handleGenerateInsights = () => {
    generateMutation.mutate({
      insightId: insight.id,
      reportId: latestReportId,
    });
  };

  if (isLoading || isGenerating) {
    return (
      <Card withBorder>
        <Stack gap="md">
          <Skeleton height={20} width="40%" />
          <Skeleton height={14} width="60%" />
          <Skeleton height={14} width="50%" />
          <Skeleton height={14} width="70%" />
        </Stack>
      </Card>
    );
  }

  if (error || !aiInsights?.keyFindings?.length) {
    return (
      <Card withBorder>
        <Stack gap="md">
          <Title order={3}>{t("detail.overview.aiInsightsTitle")}</Title>
          <Alert variant="light" color="blue" icon={<IconClock size={16} />}>
            {t("detail.overview.noAIInsightsYet")}
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateInsights}
            loading={isGenerating}
          >
            {t("detail.overview.generateAIInsights")}
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        <Title order={3}>{t("detail.overview.aiInsightsTitle")}</Title>

        {aiInsights.performanceSummary && (
          <Stack gap="sm">
            <Text fw={500}>{t("detail.overview.performanceSummary")}</Text>
            <Text size="sm">{aiInsights.performanceSummary}</Text>
          </Stack>
        )}

        {aiInsights.keyFindings.length > 0 && (
          <Stack gap="sm">
            <Text fw={500}>{t("detail.overview.keyFindings")}</Text>
            <Stack gap={4}>
              {aiInsights.keyFindings.map((finding, index) => (
                <Text size="sm" key={index}>
                  • {finding}
                </Text>
              ))}
            </Stack>
          </Stack>
        )}

        {aiInsights.recommendations.length > 0 && (
          <Stack gap="sm">
            <Text fw={500}>{t("detail.overview.recommendations")}</Text>
            <Stack gap={4}>
              {aiInsights.recommendations.map((rec, index) => (
                <Text size="sm" key={index}>
                  {index + 1}. {rec}
                </Text>
              ))}
            </Stack>
          </Stack>
        )}

        <Group gap="xs">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isGenerating}>
            {t("actions.refresh")}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateInsights}
            loading={isGenerating}
          >
            {t("detail.overview.regenerateAIInsights")}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

function OverviewTab({
  insight,
  onViewReport,
  onDownloadReport,
  onShareReport,
}: {
  insight: InsightOutput;
  onViewReport: (reportId: string) => void;
  onDownloadReport: (report: ReportListItem) => void;
  onShareReport: (report: ReportListItem) => void;
}) {
  return (
    <Stack gap="lg">
      <ConfigurationSummary insight={insight} />
      <Card withBorder>
        <Stack gap="md">
          <Title order={3}>Schedule</Title>
          <ScheduleStatusBadge
            schedule={
              scheduleService.getScheduleStatus(null) === "manual"
                ? null
                : {
                    id: insight.id,
                    tenantId: insight.tenantId,
                    entityType: "insight",
                    entityId: insight.id,
                    cronExpression: "",
                    timezone: "UTC",
                    enabled: insight.enabled,
                    metadata: {},
                    nextRunAt: null,
                    lastRunAt: null,
                    createdAt: insight.createdAt,
                    updatedAt: insight.createdAt,
                  }
            }
          />
        </Stack>
      </Card>
      <RecentReports
        insightId={insight.id}
        onViewReport={onViewReport}
        onDownloadReport={onDownloadReport}
        onShareReport={onShareReport}
      />
      <AIInsightsCard insight={insight} />
    </Stack>
  );
}

function ReportsTab({
  insightId,
  onViewReport,
  onDownloadReport,
  onShareReport,
}: {
  insightId: string;
  onViewReport: (reportId: string) => void;
  onDownloadReport: (report: ReportListItem) => void;
  onShareReport: (report: ReportListItem) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useReportList({
    page,
    pageSize,
    insightId,
  });

  if (isLoading) {
    return <ReportTableSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
        Failed to load reports
      </Alert>
    );
  }

  const reports = data?.reports || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  if (reports.length === 0) {
    return (
      <Alert variant="light" color="blue" icon={<IconReport size={16} />}>
        No reports available
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reports.map((report: ReportListItem) => (
            <Table.Tr key={report.id}>
              <Table.Td>{report.title}</Table.Td>
              <Table.Td>
                <Badge variant={report.status === "completed" ? "success" : "default"}>
                  {report.status}
                </Badge>
              </Table.Td>
              <Table.Td>{new Date(report.createdAt).toLocaleDateString()}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    leftSection={<IconEye size={14} />}
                    onClick={() => onViewReport(report.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    leftSection={<IconDownload size={14} />}
                    onClick={() => onDownloadReport(report)}
                  >
                    Download
                  </Button>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    leftSection={<IconShare size={14} />}
                    onClick={() => onShareReport(report)}
                  >
                    Share
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
        </Group>
      )}
    </Stack>
  );
}

function HistoryTab({ insightId }: { insightId: string }) {
  return <AuditTrailTimeline insightId={insightId} />;
}

function InsightDetailSkeleton() {
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Stack gap="xs">
          <Skeleton height={36} width={300} />
          <Skeleton height={20} width={200} />
        </Stack>
        <Group gap="xs">
          <Skeleton height={36} width={120} />
          <Skeleton height={36} width={100} />
        </Group>
      </Group>
      <Skeleton height={200} />
      <Skeleton height={150} />
      <Skeleton height={150} />
    </Stack>
  );
}

function InsightDetailContent() {
  const t = useTranslations("insights");
  const tNav = useTranslations("navigation");
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const insightId = params.id;

  const [activeTab, setActiveTab] = useState<string | null>("overview");
  const [shareModalOpened, setShareModalOpened] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportListItem | null>(null);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);

  const createShareMutation = trpc.report.createShareLink.useMutation({
    onSuccess: (data) => {
      setGeneratedShareUrl(data.shareUrl);
    },
  });

  const { data: insight, isLoading, error } = useInsightDetail(insightId || "");
  const { status: runStatus, runInsight } = useInsightRunMutation(insightId || "");
  const deleteMutation = useInsightDelete();
  const { data: tenantConfig } = useTenantConfig();
  const shareExpiryHours = tenantConfig?.shareLinkExpiryHours ?? 168; // 7 days default

  const handleViewReport = (reportId: string) => {
    navigate.push(ROUTE_PATHS.DASHBOARD_REPORTS_DETAIL.replace("$reportId", reportId));
  };

  const handleDownloadReport = async (report: ReportListItem) => {
    await downloadReport({
      reportId: report.id,
      fileName: report.title,
      metadata: report.metadata,
    });
  };

  const handleShareReport = (report: ReportListItem) => {
    setSelectedReport(report);
    setGeneratedShareUrl(null);
    setShareModalOpened(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBulkDownload = async (reports: ReportListItem[]) => {
    if (reports.length === 0) return;
    await bulkDownloadReports({ reports });
  };

  const typedInsight = insight as InsightOutput;

  const handleRunNow = () => {
    if (!insightId) return;
    runInsight(insightId);
  };

  const handleDelete = () => {
    if (!insightId) return;
    deleteMutation.mutate(
      { id: insightId },
      {
        onSuccess: () => {
          navigate.push(ROUTE_PATHS.DASHBOARD_INSIGHTS);
        },
      },
    );
  };

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: ROUTE_PATHS.DASHBOARD },
      { label: tNav("insights"), href: ROUTE_PATHS.DASHBOARD_INSIGHTS },
      {
        label: typedInsight?.name || t("detail.loading"),
        href: ROUTE_PATHS.DASHBOARD_INSIGHTS_DETAIL.replace("$id", insightId || ""),
      },
    ],
  });

  if (isLoading) {
    return (
      <Container size="xl">
        <InsightDetailSkeleton />
      </Container>
    );
  }

  if (error || !typedInsight) {
    return (
      <Container size="xl">
        <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
          {t("detail.errorLoading")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHeader
          insight={typedInsight}
          onBack={() => navigate.push(ROUTE_PATHS.DASHBOARD_INSIGHTS)}
          onEdit={() =>
            navigate.push(ROUTE_PATHS.DASHBOARD_INSIGHTS_EDIT.replace("$id", typedInsight.id))
          }
          onRunNow={handleRunNow}
          onDelete={handleDelete}
          isRunning={runStatus.status === "active" || runStatus.status === "waiting"}
        />

        {runStatus.status && (
          <JobStatusBadge
            status={runStatus.status}
            progress={runStatus.progress}
            error={runStatus.error}
            onRetry={runStatus.status === "failed" ? handleRunNow : undefined}
          />
        )}

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview">{t("detail.tabs.overview")}</Tabs.Tab>
            <Tabs.Tab value="reports">{t("detail.tabs.reports")}</Tabs.Tab>
            <Tabs.Tab value="history">{t("detail.tabs.history")}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <OverviewTab
              insight={typedInsight}
              onViewReport={handleViewReport}
              onDownloadReport={handleDownloadReport}
              onShareReport={handleShareReport}
            />
          </Tabs.Panel>

          <Tabs.Panel value="reports" pt="md">
            <ReportsTab
              insightId={typedInsight.id}
              onViewReport={handleViewReport}
              onDownloadReport={handleDownloadReport}
              onShareReport={handleShareReport}
            />
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            <HistoryTab insightId={typedInsight.id} />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        title="Share Report"
      >
        <Stack gap="md">
          <Text>
            Share report: <strong>{selectedReport?.title}</strong>
          </Text>
          {!generatedShareUrl ? (
            <Button
              onClick={() => {
                if (selectedReport) {
                  createShareMutation.mutate({
                    reportId: selectedReport.id,
                    expiresAt: new Date(Date.now() + shareExpiryHours * 60 * 60 * 1000),
                  });
                }
              }}
              loading={createShareMutation.isPending}
            >
              Generate Share Link
            </Button>
          ) : (
            <>
              <TextInput label="Share via link" value={generatedShareUrl} readOnly />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedShareUrl);
                  showSuccessNotification({
                    title: "Link copied",
                    message: "Share link copied to clipboard",
                  });
                }}
              >
                Copy Link
              </Button>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}

export default function InsightDetailPage() {
  return (
    <PageErrorBoundary pageName="InsightDetailPage">
      <InsightDetailContent />
    </PageErrorBoundary>
  );
}
