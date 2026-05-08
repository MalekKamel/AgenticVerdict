"use client";

import {
  Stack,
  Group,
  Text,
  Paper,
  Box,
  SimpleGrid,
  Badge,
  Alert,
  Divider,
  Progress,
  Button,
} from "@mantine/core";
import {
  IconCurrencyDollar,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconCheck,
} from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";
import type { CostTier } from "@agenticverdict/types";

interface UsageEstimate {
  monthlyRequests: number;
  avgTokensPerRequest: number;
  currentTier: CostTier;
  proposedTier: CostTier;
  currentMonthlyCost: number;
}

interface CostImpactEstimatorProps {
  estimate: UsageEstimate;
  onConfirm?: () => void;
  onCancel?: () => void;
  showRecommendation?: boolean;
}

const TIER_MULTIPLIERS: Record<CostTier, number> = {
  economy: 0.5,
  standard: 1.0,
  premium: 2.0,
};

export function CostImpactEstimator({
  estimate,
  onConfirm,
  onCancel,
  showRecommendation = true,
}: CostImpactEstimatorProps) {
  const t = useTranslations("components.costImpactEstimator");

  const currentMultiplier = TIER_MULTIPLIERS[estimate.currentTier];
  const proposedMultiplier = TIER_MULTIPLIERS[estimate.proposedTier];

  const costDifference = estimate.currentMonthlyCost * (proposedMultiplier - currentMultiplier);
  const percentageChange = ((proposedMultiplier - currentMultiplier) / currentMultiplier) * 100;
  const newMonthlyCost = estimate.currentMonthlyCost * proposedMultiplier;

  const isUpgrade = proposedMultiplier > currentMultiplier;
  const isDowngrade = proposedMultiplier < currentMultiplier;

  const getRecommendation = () => {
    if (estimate.monthlyRequests < 1000) {
      return {
        tier: "economy" as CostTier,
        reason: t("recommendations.lowUsage"),
      };
    } else if (estimate.monthlyRequests < 10000) {
      return {
        tier: "standard" as CostTier,
        reason: t("recommendations.mediumUsage"),
      };
    } else {
      return {
        tier: "premium" as CostTier,
        reason: t("recommendations.highUsage"),
      };
    }
  };

  const recommendation = showRecommendation ? getRecommendation() : null;
  const isRecommended = recommendation?.tier === estimate.proposedTier;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Text fw={600} size="lg">
            {t("title")}
          </Text>
          {isRecommended && recommendation && (
            <Badge color="green" variant="light" leftSection={<IconCheck size={14} />}>
              {t("recommended")}
            </Badge>
          )}
        </Group>

        {/* Usage Summary */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Box>
            <Text size="sm" c="dimmed">
              {t("metrics.requests")}
            </Text>
            <Text size="xl" fw={700}>
              {formatNumber(estimate.monthlyRequests)}
            </Text>
          </Box>
          <Box>
            <Text size="sm" c="dimmed">
              {t("metrics.avgTokens")}
            </Text>
            <Text size="xl" fw={700}>
              {formatNumber(estimate.avgTokensPerRequest)}
            </Text>
          </Box>
          <Box>
            <Text size="sm" c="dimmed">
              {t("metrics.totalTokens")}
            </Text>
            <Text size="xl" fw={700}>
              {formatNumber(estimate.monthlyRequests * estimate.avgTokensPerRequest)}
            </Text>
          </Box>
        </SimpleGrid>

        <Divider />

        {/* Cost Comparison */}
        <Stack gap="sm">
          <Text fw={600}>{t("costComparison")}</Text>

          <Group justify="space-between">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text size="sm" c="dimmed">
                {t("currentTier", { tier: estimate.currentTier })}
              </Text>
              <Text size="xl" fw={700}>
                {formatCurrency(estimate.currentMonthlyCost)}
              </Text>
              <Text size="xs" c="dimmed">
                {formatCurrency(
                  estimate.currentMonthlyCost / Math.max(estimate.monthlyRequests, 1),
                )}{" "}
                / {t("perRequest")}
              </Text>
            </Stack>

            <Box style={{ textAlign: "center" }}>
              {isUpgrade ? (
                <IconTrendingUp size={32} color="#fa5252" />
              ) : isDowngrade ? (
                <IconTrendingDown size={32} color="#40c057" />
              ) : (
                <IconCurrencyDollar size={32} color="#666" />
              )}
              <Text size="xs" c={isUpgrade ? "red" : isDowngrade ? "green" : "dimmed"}>
                {percentageChange >= 0 ? "+" : ""}
                {percentageChange.toFixed(0)}%
              </Text>
            </Box>

            <Stack gap="xs" style={{ flex: 1 }} align="flex-end">
              <Text size="sm" c="dimmed">
                {t("proposedTier", { tier: estimate.proposedTier })}
              </Text>
              <Text size="xl" fw={700} c={isUpgrade ? "red" : isDowngrade ? "green" : "blue"}>
                {formatCurrency(newMonthlyCost)}
              </Text>
              <Text size="xs" c="dimmed">
                {formatCurrency(newMonthlyCost / Math.max(estimate.monthlyRequests, 1))} /{" "}
                {t("perRequest")}
              </Text>
            </Stack>
          </Group>
        </Stack>

        {/* Impact Alert */}
        {costDifference !== 0 && (
          <Alert
            icon={costDifference > 0 ? <IconAlertTriangle size={16} /> : <IconCheck size={16} />}
            color={costDifference > 0 ? "orange" : "green"}
            title={
              costDifference > 0
                ? t("alerts.costIncrease", { amount: formatCurrency(costDifference) })
                : t("alerts.costSavings", { amount: formatCurrency(Math.abs(costDifference)) })
            }
          >
            {costDifference > 0
              ? t("alerts.increaseDescription", { amount: formatCurrency(costDifference * 12) })
              : t("alerts.savingsDescription", {
                  amount: formatCurrency(Math.abs(costDifference) * 12),
                })}
          </Alert>
        )}

        {/* Budget Impact Progress */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              {t("monthlyBudgetImpact")}
            </Text>
            <Text size="sm" fw={700} c={isUpgrade ? "red" : "green"}>
              {costDifference >= 0 ? "+" : ""}
              {formatCurrency(costDifference)}
            </Text>
          </Group>
          <Progress
            value={Math.min((newMonthlyCost / (estimate.currentMonthlyCost * 2)) * 100, 100)}
            color={isUpgrade ? "red" : "green"}
            size="lg"
          />
        </Stack>

        {/* Recommendation */}
        {showRecommendation && recommendation && (
          <Alert color="blue" icon={<IconCurrencyDollar size={16} />}>
            <Text size="sm" fw={600} mb="xs">
              {t("recommendation.title")}
            </Text>
            <Text size="sm">
              {t("recommendation.description", {
                tier: recommendation.tier,
                reason: recommendation.reason,
              })}
            </Text>
          </Alert>
        )}

        {/* Actions */}
        {(onConfirm || onCancel) && (
          <Group justify="flex-end" mt="md">
            {onCancel && (
              <Button variant="default" onClick={onCancel}>
                {t("actions.cancel")}
              </Button>
            )}
            {onConfirm && (
              <Button onClick={onConfirm} color={isUpgrade ? "orange" : "green"}>
                {isUpgrade ? t("actions.upgrade") : t("actions.downgrade")}
              </Button>
            )}
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

interface QuickEstimateProps {
  currentTier: CostTier;
  proposedTier: CostTier;
  currentCost: number;
  compact?: boolean;
}

export function QuickCostEstimate({
  currentTier,
  proposedTier,
  currentCost,
  compact = false,
}: QuickEstimateProps) {
  const t = useTranslations("components.costImpactEstimator");

  const currentMultiplier = TIER_MULTIPLIERS[currentTier];
  const proposedMultiplier = TIER_MULTIPLIERS[proposedTier];
  const newCost = currentCost * (proposedMultiplier / currentMultiplier);
  const difference = newCost - currentCost;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (compact) {
    return (
      <Badge color={difference > 0 ? "red" : difference < 0 ? "green" : "gray"} variant="light">
        {difference >= 0 ? "+" : ""}
        {formatCurrency(difference)}
      </Badge>
    );
  }

  return (
    <Group gap="xs">
      <Text size="sm" c="dimmed">
        {t("impact")}:
      </Text>
      <Text size="sm" fw={700} c={difference > 0 ? "red" : difference < 0 ? "green" : "dimmed"}>
        {difference >= 0 ? "+" : ""}
        {formatCurrency(difference)}
      </Text>
      {difference !== 0 && (
        <Text size="xs" c="dimmed">
          ({formatCurrency(newCost)} {t("total")})
        </Text>
      )}
    </Group>
  );
}
