import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import "@mantine/core/styles.css";
import "../styles/globals.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgenticVerdict" },
      { name: "description", content: "Multi-platform marketing analytics" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
