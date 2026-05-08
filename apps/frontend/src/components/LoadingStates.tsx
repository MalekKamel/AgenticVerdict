"use client";

import { Stack, Text, Loader, Center, Alert, Box, Skeleton, Button, rem } from "@mantine/core";
import { IconAlertCircle, IconRefresh, IconWifiOff, IconClock } from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message, fullScreen = false }: LoadingStateProps) {
  const t = useTranslations("components.loadingStates");

  const content = (
    <Center py="xl">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">{message || t("loading")}</Text>
      </Stack>
    </Center>
  );

  if (fullScreen) {
    return <Center style={{ height: "100vh", width: "100%" }}>{content}</Center>;
  }

  return content;
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  error?: Error | null;
}

export function ErrorState({ message, onRetry, error }: ErrorStateProps) {
  const t = useTranslations("components.loadingStates");

  return (
    <Alert icon={<IconAlertCircle size={20} />} color="red" title={message || t("error")} p="md">
      <Stack gap="sm">
        {error && (
          <Text size="sm" c="red">
            {error.message}
          </Text>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="xs"
            leftSection={<IconRefresh size={14} />}
            onClick={onRetry}
          >
            {t("retry")}
          </Button>
        )}
      </Stack>
    </Alert>
  );
}

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ message, actionLabel, onAction, icon }: EmptyStateProps) {
  const t = useTranslations("components.loadingStates");

  return (
    <Center py="xl">
      <Stack align="center" gap="sm">
        {icon || <IconWifiOff size={48} color="#adb5bd" />}
        <Text c="dimmed" ta="center">
          {message || t("empty")}
        </Text>
        {actionLabel && onAction && (
          <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Center>
  );
}

interface TimeoutStateProps {
  onRetry?: () => void;
  message?: string;
}

export function TimeoutState({ onRetry, message }: TimeoutStateProps) {
  const t = useTranslations("components.loadingStates");

  return (
    <Alert icon={<IconClock size={20} />} color="yellow" title={message || t("timeout")} p="md">
      {onRetry && (
        <Button
          variant="outline"
          size="xs"
          leftSection={<IconRefresh size={14} />}
          onClick={onRetry}
          mt="sm"
        >
          {t("retry")}
        </Button>
      )}
    </Alert>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <Stack gap="md">
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} p="md" style={{ border: "1px solid #e9ecef", borderRadius: 8 }}>
          <Stack gap="xs">
            <Skeleton height={20} width={100} />
            <Skeleton height={30} />
            <Skeleton height={16} width={150} />
            <Skeleton height={20} width={80} />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

interface GridSkeletonProps {
  cols?: number;
}

export function GridSkeleton({ cols = 3 }: GridSkeletonProps) {
  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: rem(16),
      }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Box key={i} p="md" style={{ border: "1px solid #e9ecef", borderRadius: 8 }}>
          <Stack gap="xs">
            <Skeleton height={20} width={100} />
            <Skeleton height={30} />
            <Skeleton height={16} width={150} />
            <Skeleton height={20} width={80} />
          </Stack>
        </Box>
      ))}
    </Box>
  );
}

interface PageLoaderProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  skeletonCount?: number;
}

export function PageLoader({
  isLoading,
  error,
  onRetry,
  children,
  skeletonCount = 3,
}: PageLoaderProps) {
  if (isLoading) {
    return <CardSkeleton count={skeletonCount} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  return <>{children}</>;
}
