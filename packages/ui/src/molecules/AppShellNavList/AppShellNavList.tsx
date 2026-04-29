"use client";

import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Group, Stack, Text, ThemeIcon, UnstyledButton } from "@mantine/core";

export type AppShellNavListItem = {
  id: string;
  label: string;
  /** Preferred normalized active state prop */
  active?: boolean;
  /** @deprecated Use `active` */
  isActive?: boolean;
  disabled?: boolean;
  /** Preferred normalized click handler */
  onClick?: () => void;
  /** @deprecated Use `onClick` */
  onSelect?: () => void;
  onPrefetch?: () => void;
  icon?: React.ReactNode;
};

export type AppShellNavListProps = {
  items: readonly AppShellNavListItem[];
  className?: string;
  "aria-label"?: string;
};

function resolveActiveState(item: AppShellNavListItem): boolean {
  return item.active ?? item.isActive ?? false;
}

function resolveSelectHandler(item: AppShellNavListItem): () => void {
  return item.onClick ?? item.onSelect ?? (() => undefined);
}

function NavItemButton({
  item,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { item: AppShellNavListItem }) {
  const active = resolveActiveState(item);
  const onSelect = resolveSelectHandler(item);

  return (
    <UnstyledButton
      type="button"
      className={clsx("group", className)}
      aria-current={active ? "page" : undefined}
      disabled={item.disabled}
      onClick={onSelect}
      onMouseEnter={item.onPrefetch}
      onFocus={item.onPrefetch}
      px="md"
      py="sm"
      style={(theme) => ({
        width: "100%",
        borderRadius: theme.radius.md,
        color: active ? "var(--mantine-color-blue-light-color)" : "var(--mantine-color-text)",
        background: active ? "var(--mantine-color-blue-light)" : "transparent",
        boxShadow: active ? theme.shadows.xs : undefined,
        opacity: item.disabled ? 0.6 : 1,
        cursor: item.disabled ? "not-allowed" : "pointer",
        transition: "all 200ms ease",
      })}
      styles={{
        root: {
          textAlign: "start",
        },
      }}
      {...props}
    >
      <Group wrap="nowrap" gap="sm">
        {item.icon ? (
          <ThemeIcon
            variant="transparent"
            color={active ? "blue" : "gray"}
            size="sm"
            aria-hidden="true"
          >
            {item.icon}
          </ThemeIcon>
        ) : null}
        <Text
          fw={active ? 600 : 500}
          size="sm"
          style={{ flex: 1, minWidth: 0, textAlign: "start" }}
        >
          {item.label}
        </Text>
        {active ? (
          <ThemeIcon
            variant="filled"
            color="blue"
            size={6}
            radius="xl"
            aria-hidden="true"
            style={{ minWidth: 6, minHeight: 6 }}
          />
        ) : null}
      </Group>
    </UnstyledButton>
  );
}

export function AppShellNavList({ items, className, ...props }: AppShellNavListProps) {
  return (
    <Stack component="nav" gap="xs" className={clsx(className)} {...props}>
      {items.map((item) => (
        <NavItemButton key={item.id} item={item} />
      ))}
    </Stack>
  );
}
