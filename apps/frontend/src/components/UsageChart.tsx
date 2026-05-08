"use client";

import { Box, Stack, Text, Group, Badge, Tooltip, Paper } from "@mantine/core";

import { useTranslations } from "@/i18n/react";

interface DataPoint {
  label: string;
  value: number;
  timestamp: Date;
}

interface UsageChartProps {
  data: DataPoint[];
  title?: string;
  valueType?: "cost" | "tokens" | "requests";
  height?: number;
  showTooltip?: boolean;
}

export function UsageChart({
  data = [],
  title,
  valueType = "cost",
  height = 300,
  showTooltip = true,
}: UsageChartProps) {
  const t = useTranslations("components.usageChart");

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const avgValue = data.length > 0 ? data.reduce((sum, d) => sum + d.value, 0) / data.length : 0;

  const formatValue = (value: number) => {
    switch (valueType) {
      case "cost":
        return `$${value.toFixed(2)}`;
      case "tokens":
        return value.toLocaleString();
      case "requests":
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const getBarColor = (value: number) => {
    const ratio = maxValue > 0 ? value / maxValue : 0;
    if (ratio > 0.8) return "#fa5252";
    if (ratio > 0.5) return "#ff922b";
    return "#40c057";
  };

  if (data.length === 0) {
    return (
      <Box
        style={{
          height,
          background: "#f8f9fa",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        role="img"
        aria-label={t("noDataAria")}
      >
        <Text c="dimmed">{t("noData")}</Text>
      </Box>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {title && (
          <Group justify="space-between">
            <Text fw={600} id="chart-title">
              {title}
            </Text>
            <Group gap="xs">
              <Badge variant="outline">
                {t("max")}: {formatValue(maxValue)}
              </Badge>
              <Badge variant="outline">
                {t("avg")}: {formatValue(avgValue)}
              </Badge>
            </Group>
          </Group>
        )}

        {/* Chart Area */}
        <Box
          style={{ height, position: "relative" }}
          role="img"
          aria-labelledby={title ? "chart-title" : undefined}
          aria-label={
            title
              ? `${title}: ${data.length} data points, ranging from ${formatValue(
                  minValue,
                )} to ${formatValue(maxValue)}`
              : undefined
          }
        >
          {/* Y-axis labels - hidden from screen readers as decorative */}
          <Box
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 60,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#666",
            }}
            aria-hidden="true"
          >
            <Text>{formatValue(maxValue)}</Text>
            <Text>{formatValue(maxValue / 2)}</Text>
            <Text>{formatValue(0)}</Text>
          </Box>

          {/* Bars */}
          <Box
            style={{
              marginLeft: 70,
              marginRight: 10,
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            {data.map((point, index) => {
              const barHeight = maxValue > 0 ? (point.value / maxValue) * (height - 40) : 0;
              const barContent = (
                <Box
                  style={{
                    flex: 1,
                    height: barHeight,
                    background: getBarColor(point.value),
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  role="img"
                  aria-label={`${point.label}: ${formatValue(point.value)}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                />
              );

              if (showTooltip) {
                return (
                  <Tooltip
                    key={index}
                    label={
                      <Stack gap="xs">
                        <Text fw={600}>{point.label}</Text>
                        <Text size="xs">{formatValue(point.value)}</Text>
                      </Stack>
                    }
                    withArrow
                    arrowSize={10}
                  >
                    {barContent}
                  </Tooltip>
                );
              }

              return barContent;
            })}
          </Box>

          {/* X-axis labels - decorative */}
          <Box
            style={{
              marginLeft: 70,
              marginRight: 10,
              height: 20,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "#666",
              marginTop: 4,
            }}
            aria-hidden="true"
          >
            {data.slice(0, 5).map((point, index) => (
              <Text key={index}>{point.label}</Text>
            ))}
          </Box>
        </Box>

        {/* Screen reader only data table */}
        <Box
          className="sr-only"
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}
        >
          <table aria-label={`${title || "Usage data"} - detailed data table`}>
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point, index) => (
                <tr key={index}>
                  <td>{point.label}</td>
                  <td>{formatValue(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Stack>
    </Paper>
  );
}

interface UsageTrendChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
}

export function UsageTrendChart({ data = [], title, height = 250 }: UsageTrendChartProps) {
  const t = useTranslations("components.usageChart");

  if (data.length === 0) {
    return (
      <Box
        style={{
          height,
          background: "#f8f9fa",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        role="img"
        aria-label={t("noDataAria")}
      >
        <Text c="dimmed">{t("noData")}</Text>
      </Box>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const points = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {title && (
          <Text fw={600} id="trend-chart-title">
            {title}
          </Text>
        )}

        <Box
          style={{ height, position: "relative" }}
          role="img"
          aria-labelledby={title ? "trend-chart-title" : undefined}
          aria-label={
            title
              ? `${title}: ${data.length} data points, ranging from ${minValue.toFixed(
                  2,
                )} to ${maxValue.toFixed(2)}`
              : undefined
          }
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ overflow: "visible" }}
            role="img"
            aria-hidden="true"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e9ecef" strokeWidth="0.5" />
            ))}

            {/* Area fill */}
            <polygon points={`0,100 ${points} 100,100`} fill="rgba(34, 139, 230, 0.1)" />

            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke="#228be6"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (point.value / maxValue) * 100;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#228be6"
                  stroke="white"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        </Box>

        {/* Screen reader only data table */}
        <Box
          className="sr-only"
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}
        >
          <table aria-label={`${title || "Usage trend"} - detailed data table`}>
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point, index) => (
                <tr key={index}>
                  <td>{point.label}</td>
                  <td>{point.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Stack>
    </Paper>
  );
}
