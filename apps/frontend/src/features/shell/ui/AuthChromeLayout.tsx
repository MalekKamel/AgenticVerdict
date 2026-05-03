"use client";

import { Box, Group } from "@mantine/core";
import type { ReactNode } from "react";

import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Minimal chrome for unauthenticated `/auth/*` routes: theme + language only
 * (no primary nav, command palette, or shell bootstrap).
 */
export function AuthChromeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Box
        component="header"
        className="flex h-14 shrink-0 items-center justify-end border-b border-[var(--av-color-border-subtle)]"
        px="md"
      >
        <Group gap="sm" wrap="nowrap">
          <LanguageSwitcher />
          <ColorSchemeToggle />
        </Group>
      </Box>
      <Box className="flex flex-1 flex-col items-center justify-center" p="md">
        {children}
      </Box>
    </div>
  );
}
