"use client";

import { Alert, Button, Skeleton, Stack, Text } from "@mantine/core";

import type { AsyncSectionStatus } from "@/features/dashboard/model/dashboard-state-transitions";

export type DashboardAsyncSectionProps = {
  sectionId: string;
  status: AsyncSectionStatus;
  title: string;
  loadingLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel: string;
  children: React.ReactNode;
};

export function DashboardAsyncSection({
  sectionId,
  status,
  title,
  loadingLabel,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorMessage,
  onRetry,
  retryLabel,
  children,
}: DashboardAsyncSectionProps) {
  if (status === "loading" || status === "idle") {
    return (
      <section aria-labelledby={`dash-section-${sectionId}`}>
        <Text component="h2" id={`dash-section-${sectionId}`} size="lg" fw={600} mb="sm">
          {title}
        </Text>
        <Text role="status">{loadingLabel}</Text>
        <Skeleton height={120} mt="md" radius="md" />
      </section>
    );
  }

  if (status === "error") {
    return (
      <section aria-labelledby={`dash-section-${sectionId}`}>
        <Text component="h2" id={`dash-section-${sectionId}`} size="lg" fw={600} mb="sm">
          {title}
        </Text>
        <Alert color="red" title={errorTitle} variant="light">
          <Stack gap="sm">
            {errorMessage ? <Text size="sm">{errorMessage}</Text> : null}
            {onRetry ? (
              <Button variant="default" onClick={onRetry}>
                {retryLabel}
              </Button>
            ) : null}
          </Stack>
        </Alert>
      </section>
    );
  }

  if (status === "empty") {
    return (
      <section aria-labelledby={`dash-section-${sectionId}`}>
        <Text component="h2" id={`dash-section-${sectionId}`} size="lg" fw={600} mb="sm">
          {title}
        </Text>
        <Alert color="gray" title={emptyTitle} variant="light">
          <Text size="sm">{emptyDescription}</Text>
        </Alert>
      </section>
    );
  }

  return (
    <section aria-labelledby={`dash-section-${sectionId}`}>
      <Text component="h2" id={`dash-section-${sectionId}`} size="lg" fw={600} mb="sm">
        {title}
      </Text>
      {children}
    </section>
  );
}
