"use client";

import {
  Container,
  Stack,
  Group,
  Title,
  Text,
  Button,
  Table,
  Checkbox,
  Badge,
  ActionIcon,
  Menu,
  Center,
  Skeleton,
  Alert,
  Modal,
  Select,
  TextInput,
  Pagination,
  ScrollArea,
} from "@mantine/core";
import { useState } from "react";
import {
  IconDownload,
  IconTrash,
  IconDotsVertical,
  IconEye,
  IconShare,
  IconAlertCircle,
  IconX,
} from "@tabler/icons-react";
import JSZip from "jszip";
import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import { useNavigate } from "@/router/hooks";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import {
  useReportList,
  useReportDelete,
  useReportDeleteMany,
} from "@/features/reports/api/report-api";
import {
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
} from "@/lib/notifications";
import { getReportErrorMessage } from "../utils/error-translator";
import { DatePickerInput } from "@mantine/dates";

function ReportTableSkeleton() {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            <Checkbox disabled />
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
          <Table.Th>
            <Skeleton height={20} />
          </Table.Th>
          <Table.Th>
            <Skeleton height={20} />
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {[...Array(10)].map((_, i) => (
          <Table.Tr key={i}>
            <Table.Td>
              <Checkbox disabled />
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

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  const t = useTranslations("reports");

  return (
    <Center style={{ width: "100%", padding: "4rem 0" }}>
      <Stack align="center" gap="md">
        <Text size="lg" c="dimmed">
          {t("list.emptyState.title")}
        </Text>
        <Button variant="outline" onClick={onClearFilters}>
          {t("list.emptyState.clearFilters")}
        </Button>
      </Stack>
    </Center>
  );
}

interface FilterBarProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    format: string;
    status: string;
    search: string;
    page?: number;
  };
  onFilterChange: (filters: {
    dateFrom: string;
    dateTo: string;
    format: string;
    status: string;
    search: string;
    page?: number;
  }) => void;
}

function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const t = useTranslations("reports");

  return (
    <Stack gap="md">
      <Group gap="md" wrap="wrap">
        <TextInput
          placeholder={t("list.searchPlaceholder")}
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Select
          placeholder={t("list.filterByFormat")}
          value={filters.format}
          onChange={(value) => onFilterChange({ ...filters, format: value || "all" })}
          data={[
            { value: "all", label: t("list.format.all") },
            { value: "pdf", label: "PDF" },
            { value: "excel", label: "Excel" },
          ]}
          style={{ width: 150 }}
        />
        <Select
          placeholder={t("list.filterByStatus")}
          value={filters.status}
          onChange={(value) => onFilterChange({ ...filters, status: value || "all" })}
          data={[
            { value: "all", label: t("list.status.all") },
            { value: "ready", label: t("list.status.ready") },
            { value: "generating", label: t("list.status.generating") },
            { value: "failed", label: t("list.status.failed") },
          ]}
          style={{ width: 150 }}
        />
        <DatePickerInput
          placeholder={t("list.dateFrom")}
          value={filters.dateFrom ? new Date(filters.dateFrom) : null}
          onChange={(date: Date | null) =>
            onFilterChange({ ...filters, dateFrom: date ? date.toISOString() : "" })
          }
          style={{ width: 150 }}
        />
        <DatePickerInput
          placeholder={t("list.dateTo")}
          value={filters.dateTo ? new Date(filters.dateTo) : null}
          onChange={(date: Date | null) =>
            onFilterChange({ ...filters, dateTo: date ? date.toISOString() : "" })
          }
          style={{ width: 150 }}
        />
      </Group>
    </Stack>
  );
}

interface BulkActionBarProps {
  selectedCount: number;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

function BulkActionBar({
  selectedCount,
  onBulkDownload,
  onBulkDelete,
  onClearSelection,
}: BulkActionBarProps) {
  const t = useTranslations("reports");

  if (selectedCount === 0) return null;

  return (
    <Alert variant="light" color="blue">
      <Group justify="space-between">
        <Text>{t("list.bulk.selected", { count: selectedCount })}</Text>
        <Group gap="xs">
          <Button
            variant="outline"
            size="sm"
            leftSection={<IconDownload size={16} />}
            onClick={onBulkDownload}
          >
            {t("list.bulk.download")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={onBulkDelete}
          >
            {t("list.bulk.delete")}
          </Button>
          <ActionIcon variant="subtle" onClick={onClearSelection}>
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Alert>
  );
}

export default function ReportListPage() {
  const t = useTranslations("reports");
  const tNav = useTranslations("navigation");
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    format: "all",
    status: "all",
    search: "",
    page: 1,
  });

  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);

  const { data, isLoading, error } = useReportList({
    status: filters.status === "all" ? undefined : filters.status,
    format: filters.format === "all" ? undefined : (filters.format as "pdf" | "excel"),
    search: filters.search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: filters.page,
    pageSize: 20,
  });

  const deleteMutation = useReportDelete();
  const deleteManyMutation = useReportDeleteMany();

  const reports = data?.reports || [];
  const totalPages = data?.total ? Math.ceil(data.total / 20) : 1;

  if (error) {
    return (
      <Container size="xl">
        <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
          {t("list.errorLoading")}
        </Alert>
      </Container>
    );
  }

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: ROUTE_PATHS.DASHBOARD },
      { label: tNav("reports"), href: ROUTE_PATHS.DASHBOARD_REPORTS },
    ],
    headerContext: (
      <Group justify="space-between">
        <div>
          <Title order={1}>{t("list.pageTitle")}</Title>
          <Text c="dimmed">{t("list.pageSubtitle")}</Text>
        </div>
      </Group>
    ),
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const handleSelectReport = (id: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedReports(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.map((r) => r.id)));
    }
  };

  const handleBulkDownload = async () => {
    const selectedIds = Array.from(selectedReports);
    if (selectedIds.length === 0) return;

    if (selectedIds.length > 10) {
      showErrorNotification({
        title: "Too many reports",
        message: "Please select at most 10 reports for bulk download",
      });
      return;
    }

    try {
      if (selectedIds.length >= 3) {
        showInfoNotification({
          title: "Preparing download",
          message: `Preparing ${selectedIds.length} reports for download...`,
        });
      }

      const zip = new JSZip();
      const reportsFolder = zip.folder("reports");

      // Get selected report objects
      const selectedReportObjects = reports.filter((r) => selectedIds.includes(r.id));

      // Download all reports and add to ZIP
      await Promise.all(
        selectedReportObjects.map(async (report) => {
          try {
            // TODO: Implement actual report fetching
            // For now, just add a placeholder file
            reportsFolder?.file(
              `${report.title}.txt`,
              `Report: ${report.title}\nGenerated: ${report.createdAt}`,
            );
          } catch (error) {
            console.error(`Failed to download report ${report.id}:`, error);
          }
        }),
      );

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reports-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccessNotification({
        title: "Download complete",
        message: `${selectedReportObjects.length} reports downloaded successfully`,
      });
    } catch (error) {
      showErrorNotification({
        title: "Bulk download failed",
        message: getReportErrorMessage(error),
      });
    }
  };

  const handleViewReport = (reportId: string) => {
    navigate.push(ROUTE_PATHS.DASHBOARD_REPORTS_DETAIL.replace("$reportId", reportId));
  };

  const handleDownloadReport = async (report: (typeof reports)[0]) => {
    try {
      showInfoNotification({
        title: "Downloading report",
        message: "Your report is being downloaded",
      });

      // TODO: Implement actual download logic with tRPC endpoint
      showSuccessNotification({
        title: "Download started",
        message: `Downloading ${report.title}`,
      });
    } catch (error) {
      showErrorNotification({
        title: "Download failed",
        message: getReportErrorMessage(error),
      });
    }
  };

  const [shareModalOpened, setShareModalOpened] = useState(false);
  const [selectedReportForShare, setSelectedReportForShare] = useState<(typeof reports)[0] | null>(
    null,
  );

  const handleShareReport = (report: (typeof reports)[0]) => {
    setSelectedReportForShare(report);
    setShareModalOpened(true);
  };

  const handleBulkDelete = () => {
    setDeleteTargetIds(Array.from(selectedReports));
    setShowDeleteConfirm(true);
  };

  const handleDeleteReport = (id: string) => {
    setDeleteTargetIds([id]);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteTargetIds.length === 1) {
      deleteMutation.mutate(
        { id: deleteTargetIds[0]! },
        {
          onSuccess: () => {
            setSelectedReports(new Set());
            setShowDeleteConfirm(false);
            setDeleteTargetIds([]);
          },
        },
      );
    } else {
      deleteManyMutation.mutate(
        { ids: deleteTargetIds },
        {
          onSuccess: () => {
            setSelectedReports(new Set());
            setShowDeleteConfirm(false);
            setDeleteTargetIds([]);
          },
        },
      );
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      format: "all",
      status: "all",
      search: "",
      page: 1,
    });
  };

  if (error) {
    return (
      <Container size="xl">
        <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
          {t("list.errorLoading")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <FilterBar
          filters={filters}
          onFilterChange={(newFilters) => setFilters({ ...newFilters, page: newFilters.page ?? 1 })}
        />

        <BulkActionBar
          selectedCount={selectedReports.size}
          onBulkDownload={handleBulkDownload}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedReports(new Set())}
        />

        {isLoading ? (
          <ReportTableSkeleton />
        ) : reports.length === 0 ? (
          <EmptyState onClearFilters={clearFilters} />
        ) : (
          <>
            <ScrollArea>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Checkbox
                        checked={selectedReports.size === reports.length && reports.length > 0}
                        onChange={handleSelectAll}
                      />
                    </Table.Th>
                    <Table.Th onClick={() => handleSort("title")} style={{ cursor: "pointer" }}>
                      {t("list.columns.name")}
                      {sortColumn === "title" && (sortDirection === "asc" ? " ↑" : " ↓")}
                    </Table.Th>
                    <Table.Th onClick={() => handleSort("createdAt")} style={{ cursor: "pointer" }}>
                      {t("list.columns.date")}
                      {sortColumn === "createdAt" && (sortDirection === "asc" ? " ↑" : " ↓")}
                    </Table.Th>
                    <Table.Th>{t("list.columns.format")}</Table.Th>
                    <Table.Th>{t("list.columns.status")}</Table.Th>
                    <Table.Th>{t("list.columns.actions")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {reports.map((report) => (
                    <Table.Tr key={report.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedReports.has(report.id)}
                          onChange={() => handleSelectReport(report.id)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>{report.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="outline">
                          {(report.metadata as { format?: string })?.format || "PDF"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          variant={
                            report.status === "ready"
                              ? "success"
                              : report.status === "generating"
                                ? "blue"
                                : "red"
                          }
                        >
                          {t(`list.status.${report.status}`)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon variant="subtle" onClick={() => handleViewReport(report.id)}>
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" onClick={() => handleDownloadReport(report)}>
                            <IconDownload size={16} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" onClick={() => handleShareReport(report)}>
                            <IconShare size={16} />
                          </ActionIcon>
                          <Menu withinPortal>
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                {t("list.actions.delete")}
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            {totalPages > 1 && (
              <Group justify="center">
                <Pagination
                  value={filters.page}
                  onChange={(page) => setFilters({ ...filters, page })}
                  total={totalPages}
                />
              </Group>
            )}
          </>
        )}
      </Stack>

      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t("list.deleteConfirm.title")}
        centered
      >
        <Stack gap="md">
          <Text>
            {deleteTargetIds.length === 1
              ? t("list.deleteConfirm.single")
              : t("list.deleteConfirm.multiple", { count: deleteTargetIds.length })}
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {t("list.deleteConfirm.cancel")}
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={deleteMutation.isPending || deleteManyMutation.isPending}
            >
              {t("list.deleteConfirm.delete")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        title="Share Report"
      >
        <Stack gap="md">
          <Text>
            Share report: <strong>{selectedReportForShare?.title}</strong>
          </Text>
          <TextInput
            label="Share via link"
            value={
              selectedReportForShare
                ? `${window.location.origin}/shared/reports/${selectedReportForShare.id}`
                : ""
            }
            readOnly
          />
          <Button
            onClick={() => {
              if (selectedReportForShare) {
                navigator.clipboard.writeText(
                  `${window.location.origin}/shared/reports/${selectedReportForShare.id}`,
                );
                showSuccessNotification({
                  title: "Link copied",
                  message: "Share link copied to clipboard",
                });
              }
            }}
          >
            Copy Link
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
