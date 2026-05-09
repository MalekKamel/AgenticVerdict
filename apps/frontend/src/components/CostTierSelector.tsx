"use client";

import { Stack, Group, Text, Box, Radio, Badge, Tooltip, Alert } from "@mantine/core";
import { IconInfoCircle, IconCurrencyDollar, IconTrendingUp } from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";
import type { CostTier } from "@agenticverdict/types";

interface CostTierOption {
  value: CostTier;
  label: string;
  description: string;
  priceMultiplier: number;
  features: string[];
  color: string;
}

const TIER_OPTIONS: CostTierOption[] = [
  {
    value: "economy",
    label: "Economy",
    description: "Best for development and testing",
    priceMultiplier: 0.5,
    features: ["Lower cost", "Standard speed", "Basic models"],
    color: "green",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced performance and cost",
    priceMultiplier: 1.0,
    features: ["Optimal pricing", "Good speed", "All models"],
    color: "blue",
  },
  {
    value: "premium",
    label: "Premium",
    description: "Maximum performance and priority",
    priceMultiplier: 2.0,
    features: ["Priority access", "Fastest speed", "Premium models", "Higher limits"],
    color: "purple",
  },
];

interface CostTierSelectorProps {
  value?: CostTier;
  onChange?: (tier: CostTier) => void;
  disabled?: boolean;
  showDescriptions?: boolean;
  showPriceImpact?: boolean;
  basePrice?: number;
}

export function CostTierSelector({
  value,
  onChange,
  disabled = false,
  showDescriptions = true,
  showPriceImpact = false,
  basePrice = 0,
}: CostTierSelectorProps) {
  const t = useTranslations("components");

  const handleTierChange = (tierValue: string) => {
    if (!disabled && onChange) {
      onChange(tierValue as CostTier);
    }
  };

  const calculatePrice = (multiplier: number) => {
    if (!basePrice) return null;
    const price = basePrice * multiplier;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Stack gap="md">
      <Group gap="xs">
        <Text fw={600}>{t("costTierSelector.label")}</Text>
        <Tooltip label={t("costTierSelector.tooltip")}>
          <IconInfoCircle size={16} color="#666" />
        </Tooltip>
      </Group>

      <Radio.Group value={value} onChange={handleTierChange}>
        <Stack gap="sm">
          {TIER_OPTIONS.map((tier) => (
            <Radio.Card
              key={tier.value}
              value={tier.value}
              p="md"
              withBorder
              style={{
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                borderColor: value === tier.value ? tier.color : undefined,
                backgroundColor:
                  value === tier.value ? `var(--mantine-color-${tier.color}-light)` : undefined,
              }}
            >
              <Group gap="md" wrap="nowrap">
                <Radio.Indicator size="lg" />

                <Box style={{ flex: 1 }}>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Text fw={600} size="lg">
                        {t(`costTierSelector.tiers.${tier.value}.label`)}
                      </Text>
                      <Badge color={tier.color} variant="light" size="sm">
                        {tier.label}
                      </Badge>
                    </Group>

                    {showPriceImpact && basePrice && (
                      <Group gap="xs">
                        <IconCurrencyDollar size={16} color="#666" />
                        <Text fw={700} c={tier.color}>
                          {calculatePrice(tier.priceMultiplier)}
                        </Text>
                      </Group>
                    )}
                  </Group>

                  {showDescriptions && (
                    <Text size="sm" c="dimmed" mb="xs">
                      {t(`costTierSelector.tiers.${tier.value}.description`)}
                    </Text>
                  )}

                  <Group gap="xs">
                    {tier.features.map((feature, index) => (
                      <Badge key={index} variant="outline" size="xs" color={tier.color}>
                        {feature}
                      </Badge>
                    ))}
                  </Group>

                  {value === tier.value && showPriceImpact && tier.priceMultiplier !== 1.0 && (
                    <Alert
                      icon={<IconTrendingUp size={14} />}
                      color={tier.priceMultiplier > 1 ? "orange" : "green"}
                      mt="xs"
                      p="xs"
                    >
                      {tier.priceMultiplier > 1
                        ? t("costTierSelector.priceIncrease", {
                            percent: ((tier.priceMultiplier - 1) * 100).toFixed(0),
                          })
                        : t("costTierSelector.priceDecrease", {
                            percent: ((1 - tier.priceMultiplier) * 100).toFixed(0),
                          })}
                    </Alert>
                  )}
                </Box>
              </Group>
            </Radio.Card>
          ))}
        </Stack>
      </Radio.Group>

      {showPriceImpact && basePrice && (
        <Box mt="md" p="sm" style={{ background: "#f8f9fa", borderRadius: 8 }}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {t("costTierSelector.currentSelection")}
            </Text>
            <Text size="sm" fw={600}>
              {value
                ? t(`costTierSelector.tiers.${value}.label`)
                : t("costTierSelector.notSelected")}
              {value && basePrice && (
                <Text component="span" ml="xs" c="blue">
                  (
                  {calculatePrice(
                    TIER_OPTIONS.find((t) => t.value === value)?.priceMultiplier || 1,
                  )}
                  )
                </Text>
              )}
            </Text>
          </Group>
        </Box>
      )}
    </Stack>
  );
}

interface CostTierDisplayProps {
  tier: CostTier;
  compact?: boolean;
}

export function CostTierDisplay({ tier, compact = false }: CostTierDisplayProps) {
  const t = useTranslations("components");

  const tierInfo = TIER_OPTIONS.find((t) => t.value === tier);

  if (!tierInfo) return null;

  if (compact) {
    return (
      <Badge color={tierInfo.color} variant="light" size="sm">
        {t(`costTierSelector.tiers.${tier}.label`)}
      </Badge>
    );
  }

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Badge color={tierInfo.color} size="md">
          {t(`costTierSelector.tiers.${tier}.label`)}
        </Badge>
        <Text size="sm" c="dimmed">
          {t(`costTierSelector.tiers.${tier}.description`)}
        </Text>
      </Group>
      <Group gap="xs">
        {tierInfo.features.map((feature, index) => (
          <Badge key={index} variant="outline" size="xs">
            {feature}
          </Badge>
        ))}
      </Group>
    </Stack>
  );
}
