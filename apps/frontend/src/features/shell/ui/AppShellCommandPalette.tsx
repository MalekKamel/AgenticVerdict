"use client";

import {
  ActionIcon,
  Group,
  Kbd,
  Modal,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure, useHotkeys } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@/i18n/react";

import type { AppShellNavItem } from "./app-shell-navigation";

type AppShellCommandPaletteProps = {
  items: readonly AppShellNavItem[];
  onNavigate: (item: AppShellNavItem) => void;
  onOpen?: (source: "button" | "hotkey") => void;
};

export function AppShellCommandPalette({ items, onNavigate, onOpen }: AppShellCommandPaletteProps) {
  const t = useTranslations("Layout");
  const navT = useTranslations("navigation");
  const [opened, { open, close }] = useDisclosure(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 120);
  const inputRef = useRef<HTMLInputElement>(null);

  useHotkeys([
    [
      "mod+K",
      () => {
        onOpen?.("hotkey");
        open();
      },
    ],
  ]);

  const filteredItems = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((item) => navT(item.labelKey).toLowerCase().includes(normalized));
  }, [debouncedQuery, items, navT]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [opened]);

  return (
    <>
      <ActionIcon
        variant="subtle"
        size="lg"
        radius="md"
        onClick={() => {
          onOpen?.("button");
          open();
        }}
        aria-label={t("openCommandPalette")}
      >
        <IconSearch size={18} />
      </ActionIcon>
      <Modal
        opened={opened}
        onClose={() => {
          setQuery("");
          close();
        }}
        title={t("commandPaletteTitle")}
        centered
      >
        <Stack gap="sm">
          <TextInput
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={t("commandPalettePlaceholder")}
            leftSection={<IconSearch size={16} />}
          />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              {t("commandPaletteHint")}
            </Text>
            <Kbd>⌘K</Kbd>
          </Group>
          <Stack gap={6}>
            {filteredItems.map((item) => (
              <UnstyledButton
                key={item.id}
                px="sm"
                py={8}
                style={(theme) => ({
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.gray[3]}`,
                })}
                onClick={() => {
                  onNavigate(item);
                  setQuery("");
                  close();
                }}
              >
                <Text size="sm">{navT(item.labelKey)}</Text>
              </UnstyledButton>
            ))}
            {filteredItems.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("commandPaletteEmpty")}
              </Text>
            ) : null}
          </Stack>
        </Stack>
      </Modal>
    </>
  );
}
