"use client";

import { Anchor, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { AuthUserData } from "@/features/auth/api/auth-api";
import type { DashboardWidgetId } from "@/features/dashboard/model/contracts";
import {
  readDashboardLayout,
  writeDashboardLayout,
} from "@/features/dashboard/model/dashboard-layout-persistence";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";
import { useTenant } from "@/features/auth/providers/TenantProvider";

import { resolveDashboardPermissions } from "./dashboard-permissions";

const defaultOrder: DashboardWidgetId[] = ["kpi_grid", "insights", "connectors", "quick_actions"];

export type CustomizeDashboardPageProps = {
  user: AuthUserData | null;
};

export function CustomizeDashboardPage({ user }: CustomizeDashboardPageProps) {
  const t = useTranslations("dashboard");
  const { tenantId } = useTenant();
  const permissions = useMemo(() => resolveDashboardPermissions(user), [user]);
  const userId = user?.id ?? "anonymous";

  const [editMode, setEditMode] = useState(false);
  const [order, setOrder] = useState<DashboardWidgetId[]>(defaultOrder);

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    setOrder(readDashboardLayout({ tenantId, userId }).order);
  }, [tenantId, userId]);

  const persist = useCallback(() => {
    if (!tenantId) {
      return;
    }
    writeDashboardLayout({ tenantId, userId }, { order });
  }, [tenantId, userId, order]);

  const move = (id: DashboardWidgetId, dir: -1 | 1) => {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) {
        return prev;
      }
      const copy = [...prev];
      const tmp = copy[idx];
      copy[idx] = copy[next]!;
      copy[next] = tmp!;
      return copy;
    });
  };

  const reset = () => {
    setOrder(defaultOrder);
    if (tenantId) {
      writeDashboardLayout({ tenantId, userId }, { order: defaultOrder });
    }
  };

  if (!permissions.canCustomizeLayout) {
    return (
      <Stack component="main" gap="md" aria-label={t("customize.ariaMain")}>
        <Title order={1}>{t("customize.title")}</Title>
        <Text role="status">{t("customize.noPermission")}</Text>
        <div>
          <AnchorBack />
        </div>
      </Stack>
    );
  }

  return (
    <Stack component="main" gap="lg" aria-label={t("customize.ariaMain")}>
      <Stack gap={4}>
        <Title order={1}>{t("customize.title")}</Title>
        <Text size="sm" c="dimmed">
          {t("customize.subtitle")}
        </Text>
        <AnchorBack />
      </Stack>
      <Group gap="sm" wrap="wrap">
        <Button
          variant={editMode ? "filled" : "light"}
          onClick={() => setEditMode((v) => !v)}
          aria-pressed={editMode}
        >
          {editMode ? t("customize.viewMode") : t("customize.editMode")}
        </Button>
        <Button variant="default" onClick={persist} disabled={!tenantId}>
          {t("customize.save")}
        </Button>
        <Button variant="outline" onClick={reset}>
          {t("customize.reset")}
        </Button>
      </Group>
      <Text size="sm" c="dimmed">
        {t("customize.hint")}
      </Text>
      <section aria-labelledby="palette-heading">
        <Text id="palette-heading" size="sm" fw={600} mb="xs">
          {t("customize.palette")}
        </Text>
        <Stack gap="xs">
          {order.map((id) => (
            <Card key={id} withBorder padding="sm" radius="md">
              <Group justify="space-between" wrap="wrap">
                <Text fw={500}>{t(`widgets.${id}` as never)}</Text>
                {editMode ? (
                  <Group gap="xs">
                    <Button type="button" size="xs" variant="default" onClick={() => move(id, -1)}>
                      ↑
                    </Button>
                    <Button type="button" size="xs" variant="default" onClick={() => move(id, 1)}>
                      ↓
                    </Button>
                  </Group>
                ) : null}
              </Group>
            </Card>
          ))}
        </Stack>
      </section>
    </Stack>
  );
}

function AnchorBack() {
  const t = useTranslations("dashboard");
  return (
    <Anchor component={Link} href="/dashboard" size="sm">
      {t("home.title")}
    </Anchor>
  );
}
