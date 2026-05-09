"use client";

import { useState, useMemo } from "react";
import {
  Table,
  ScrollArea,
  TextInput,
  Group,
  Badge,
  Text,
  Box,
  ActionIcon,
  Menu,
  Divider,
  Paper,
  Stack,
} from "@mantine/core";
import {
  IconSearch,
  IconDotsVertical,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconDownload,
} from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";

interface UsageRecord {
  id: string;
  date: string;
  provider: string;
  model?: string;
  tokens: number;
  cost: number;
  requests: number;
  avgLatency: number;
  status: "success" | "error" | "partial";
  domain?: string;
}

interface UsageTableProps {
  data: UsageRecord[];
  isLoading?: boolean;
  onRowClick?: (record: UsageRecord) => void;
  enableExport?: boolean;
}

export function UsageTable({ data = [], onRowClick, enableExport = true }: UsageTableProps) {
  const t = useTranslations("components");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof UsageRecord>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter] = useState<string | null>(null);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter by search
    if (searchQuery) {
      result = result.filter(
        (record) =>
          record.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.domain?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter((record) => record.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? -1 : 1;
      if (bVal == null) return sortDirection === "asc" ? 1 : -1;

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchQuery, sortField, sortDirection, statusFilter]);

  const handleSort = (field: keyof UsageRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const SortIcon = ({ field }: { field: keyof UsageRecord }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />;
  };

  const StatusBadge = ({ status }: { status: UsageRecord["status"] }) => {
    const colors = {
      success: "green",
      error: "red",
      partial: "yellow",
    };

    return (
      <Badge color={colors[status]} variant="light" size="sm">
        {t(`usageTable.status.${status}`)}
      </Badge>
    );
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Filters */}
        <Group gap="md">
          <TextInput
            placeholder={t("usageTable.filters.search")}
            label={t("usageTable.filters.searchLabel")}
            aria-label={t("usageTable.filters.searchAriaLabel")}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Menu>
            <Menu.Target>
              <ActionIcon
                variant="outline"
                aria-label={t("usageTable.actions.menuLabel")}
                title={t("usageTable.actions.menuTitle")}
              >
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={() => {
                  // Toggle columns
                }}
              >
                {t("usageTable.actions.toggleColumns")}
              </Menu.Item>
              {enableExport && (
                <>
                  <Divider />
                  <Menu.Item
                    leftSection={<IconDownload size={14} />}
                    onClick={() => {
                      // Export to CSV
                    }}
                  >
                    {t("usageTable.actions.exportCSV")}
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Table */}
        <ScrollArea aria-label={t("usageTable.table.ariaLabel")} type="scroll" scrollHideDelay={0}>
          <Table role="grid" aria-rowcount={filteredAndSortedData.length + 1}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Group gap="xs">
                    {t("usageTable.columns.date")}
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={() => handleSort("date")}
                      aria-label={
                        sortField === "date"
                          ? sortDirection === "asc"
                            ? t("usageTable.columns.sortDesc")
                            : t("usageTable.columns.sortAsc")
                          : t("usageTable.columns.sortBy", { field: t("usageTable.columns.date") })
                      }
                    >
                      <SortIcon field="date" />
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>
                  <Group gap="xs">
                    {t("usageTable.columns.provider")}
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={() => handleSort("provider")}
                      aria-label={
                        sortField === "provider"
                          ? sortDirection === "asc"
                            ? t("usageTable.columns.sortDesc")
                            : t("usageTable.columns.sortAsc")
                          : t("usageTable.columns.sortBy", {
                              field: t("usageTable.columns.provider"),
                            })
                      }
                    >
                      <SortIcon field="provider" />
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>{t("usageTable.columns.model")}</Table.Th>
                <Table.Th>{t("usageTable.columns.domain")}</Table.Th>
                <Table.Th>
                  <Group gap="xs">
                    {t("usageTable.columns.tokens")}
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={() => handleSort("tokens")}
                      aria-label={
                        sortField === "tokens"
                          ? sortDirection === "asc"
                            ? t("usageTable.columns.sortDesc")
                            : t("usageTable.columns.sortAsc")
                          : t("usageTable.columns.sortBy", {
                              field: t("usageTable.columns.tokens"),
                            })
                      }
                    >
                      <SortIcon field="tokens" />
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>
                  <Group gap="xs">
                    {t("usageTable.columns.cost")}
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={() => handleSort("cost")}
                      aria-label={
                        sortField === "cost"
                          ? sortDirection === "asc"
                            ? t("usageTable.columns.sortDesc")
                            : t("usageTable.columns.sortAsc")
                          : t("usageTable.columns.sortBy", { field: t("usageTable.columns.cost") })
                      }
                    >
                      <SortIcon field="cost" />
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>
                  <Group gap="xs">
                    {t("usageTable.columns.requests")}
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={() => handleSort("requests")}
                      aria-label={
                        sortField === "requests"
                          ? sortDirection === "asc"
                            ? t("usageTable.columns.sortDesc")
                            : t("usageTable.columns.sortAsc")
                          : t("usageTable.columns.sortBy", {
                              field: t("usageTable.columns.requests"),
                            })
                      }
                    >
                      <SortIcon field="requests" />
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>{t("usageTable.columns.latency")}</Table.Th>
                <Table.Th>{t("usageTable.columns.status")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAndSortedData.map((record, index) => (
                <Table.Tr
                  key={record.id}
                  onClick={() => onRowClick?.(record)}
                  style={{
                    cursor: onRowClick ? "pointer" : "default",
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onRowClick(record);
                    }
                  }}
                  aria-rowindex={index + 2}
                >
                  <Table.Td>{record.date}</Table.Td>
                  <Table.Td>
                    <Badge variant="outline">{record.provider}</Badge>
                  </Table.Td>
                  <Table.Td>{record.model || "-"}</Table.Td>
                  <Table.Td>{record.domain || "-"}</Table.Td>
                  <Table.Td>{formatNumber(record.tokens)}</Table.Td>
                  <Table.Td fw={600}>{formatCurrency(record.cost)}</Table.Td>
                  <Table.Td>{formatNumber(record.requests)}</Table.Td>
                  <Table.Td>{record.avgLatency.toFixed(0)}ms</Table.Td>
                  <Table.Td>
                    <StatusBadge status={record.status} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {filteredAndSortedData.length === 0 && (
          <Box py="xl" role="status">
            <Text c="dimmed" ta="center">
              {t("usageTable.noData")}
            </Text>
          </Box>
        )}

        {/* Summary footer */}
        {filteredAndSortedData.length > 0 && (
          <Group justify="space-between" pt="md" role="status">
            <Text size="sm" c="dimmed">
              {t("usageTable.showing", {
                from: 1,
                to: filteredAndSortedData.length,
                total: data.length,
              })}
            </Text>
            <Group gap="xs">
              <Text size="sm" fw={600}>
                {t("usageTable.summary.totalCost")}:
              </Text>
              <Text size="sm" fw={700} c="blue">
                {formatCurrency(filteredAndSortedData.reduce((sum, r) => sum + r.cost, 0))}
              </Text>
            </Group>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
