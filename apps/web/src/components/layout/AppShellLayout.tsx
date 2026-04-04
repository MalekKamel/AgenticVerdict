"use client";

import { AppShell, Burger, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AppShellLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const t = useTranslations("Layout");

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={t("openNav")}
            />
            <Text fw={600} component="span">
              {t("brand")}
            </Text>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <LanguageSwitcher />
            <ColorSchemeToggle />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" hiddenFrom="sm">
        <Text size="sm" c="dimmed">
          {t("navHint")}
        </Text>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
