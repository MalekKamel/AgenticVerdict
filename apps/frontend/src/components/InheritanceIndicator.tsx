"use client";

import { Stack, Group, Text, ThemeIcon, Box, Tooltip, Badge } from "@mantine/core";
import { IconHeartCancel, IconArrowRight, IconAlertCircle, IconCheck } from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";

interface InheritanceIndicatorProps {
  level: "tenant" | "domain" | "connector";
  inheritedFrom?: "tenant" | "domain";
  hasOverride?: boolean;
  providerName?: string;
  showTooltip?: boolean;
  compact?: boolean;
}

export function InheritanceIndicator({
  level,
  inheritedFrom,
  hasOverride = false,
  providerName,
  showTooltip = true,
  compact = false,
}: InheritanceIndicatorProps) {
  const t = useTranslations("components.inheritanceIndicator");

  const getLevelInfo = () => {
    switch (level) {
      case "tenant":
        return {
          label: t("levels.tenant"),
          color: "blue",
          icon: IconHeartCancel,
        };
      case "domain":
        return {
          label: t("levels.domain"),
          color: "green",
          icon: IconArrowRight,
        };
      case "connector":
        return {
          label: t("levels.connector"),
          color: "orange",
          icon: IconArrowRight,
        };
    }
  };

  const getStatusInfo = () => {
    if (level === "tenant") {
      return {
        label: t("status.source"),
        color: "blue" as const,
        icon: IconCheck,
      };
    }

    if (hasOverride) {
      return {
        label: t("status.override"),
        color: "green" as const,
        icon: IconCheck,
      };
    }

    if (inheritedFrom) {
      return {
        label: t("status.inherited", { from: t(`levels.${inheritedFrom}`) }),
        color: "gray" as const,
        icon: IconHeartCancel,
      };
    }

    return {
      label: t("status.unknown"),
      color: "gray" as const,
      icon: IconAlertCircle,
    };
  };

  const levelInfo = getLevelInfo();
  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const content = (
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon
        size={compact ? "sm" : "md"}
        variant="light"
        color={levelInfo.color}
        style={{ borderRadius: 6 }}
      >
        <levelInfo.icon size={compact ? 14 : 18} />
      </ThemeIcon>

      <Stack gap={compact ? 2 : 4} style={{ flex: 1 }}>
        <Group gap="xs" wrap="nowrap">
          <Text size={compact ? "xs" : "sm"} fw={600} c={levelInfo.color}>
            {levelInfo.label}
          </Text>

          <Badge
            size={compact ? "xs" : "sm"}
            variant="light"
            color={statusInfo.color}
            leftSection={<StatusIcon size={10} />}
          >
            {statusInfo.label}
          </Badge>
        </Group>

        {providerName && (
          <Text size={compact ? "xs" : "sm"} c="dimmed">
            {t("usingProvider", { name: providerName })}
          </Text>
        )}
      </Stack>
    </Group>
  );

  if (showTooltip) {
    const tooltipContent = (
      <Stack gap="xs" style={{ maxWidth: 250 }}>
        <Text fw={600} size="sm">
          {t("tooltip.title")}
        </Text>
        <Text size="xs">
          {level === "tenant"
            ? t("tooltip.tenant")
            : level === "domain"
              ? hasOverride
                ? t("tooltip.domainOverride")
                : t("tooltip.domainInherited")
              : hasOverride
                ? t("tooltip.connectorOverride")
                : t("tooltip.connectorInherited")}
        </Text>
      </Stack>
    );

    return <Tooltip label={tooltipContent}>{content}</Tooltip>;
  }

  return content;
}

interface InheritanceChainProps {
  tenantProvider?: string;
  domainProvider?: string;
  connectorProvider?: string;
  compact?: boolean;
}

export function InheritanceChain({
  tenantProvider,
  domainProvider,
  connectorProvider,
  compact = false,
}: InheritanceChainProps) {
  const t = useTranslations("components.inheritanceIndicator");

  const effectiveProvider = connectorProvider || domainProvider || tenantProvider;
  const effectiveLevel = connectorProvider ? "connector" : domainProvider ? "domain" : "tenant";

  return (
    <Box>
      <Stack gap="xs">
        {/* Tenant level */}
        <InheritanceIndicator
          level="tenant"
          providerName={tenantProvider}
          showTooltip={!compact}
          compact={compact}
        />

        {/* Domain level */}
        {domainProvider && (
          <InheritanceIndicator
            level="domain"
            inheritedFrom="tenant"
            hasOverride={!!domainProvider && domainProvider !== tenantProvider}
            providerName={domainProvider}
            showTooltip={!compact}
            compact={compact}
          />
        )}

        {/* Connector level */}
        {connectorProvider && (
          <InheritanceIndicator
            level="connector"
            inheritedFrom={domainProvider ? "domain" : "tenant"}
            hasOverride={true}
            providerName={connectorProvider}
            showTooltip={!compact}
            compact={compact}
          />
        )}

        {/* Effective provider summary */}
        <Box
          mt="xs"
          p="sm"
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: 6,
            border: "1px solid #e9ecef",
          }}
        >
          <Group gap="xs">
            <IconCheck size={16} color="#228be6" />
            <Text size={compact ? "xs" : "sm"} fw={500}>
              {t("effectiveProvider")}
            </Text>
            <Text size={compact ? "xs" : "sm"} fw={700} c="blue">
              {effectiveProvider || t("noProvider")}
            </Text>
            <Text size={compact ? "xs" : "sm"} c="dimmed">
              ({t(`levels.${effectiveLevel}`)})
            </Text>
          </Group>
        </Box>
      </Stack>
    </Box>
  );
}
