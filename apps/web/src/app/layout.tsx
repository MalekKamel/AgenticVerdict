import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@mantine/core/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgenticVerdict",
  description: "Multi-platform marketing analytics",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>{children}</body>
    </html>
  );
}
