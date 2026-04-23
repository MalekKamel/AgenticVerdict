# @agenticverdict/ui

Design system **tokens**, **tenant branding**, **RTL/LTR**, and **Mantine theme wiring** for AgenticVerdict. Application UI should use **`@mantine/core`** (and related Mantine packages) for buttons, inputs, feedback, overlays, and layout—this package no longer ships duplicate wrappers for those primitives.

## Installation

```bash
pnpm add @agenticverdict/ui @mantine/core @mantine/hooks
```

## What this package exports

- **Tokens** (`defaultBrandTheme`, `brandTokensSchema`, helpers) — three-tier design variables
- **Providers** — `ThemeProvider`, `DirectionProvider`, `MantineProvider`, `UIProvider`
- **Hooks** — `useTheme`, `useTenantTheme`, `useDirection`, `getLogicalProperty`, `flipForRTL`
- **Primitives** — `Icon` (sizing wrapper for Lucide/SVG), `AppShellNavList` (shell navigation list)
- **Utilities** — `clsx` / `cn`

## Quick start

```tsx
import { UIProvider } from "@agenticverdict/ui";
import { Button, TextInput } from "@mantine/core";

function App() {
  return (
    <UIProvider>
      <TextInput label="Email" />
      <Button>Submit</Button>
    </UIProvider>
  );
}
```

## Theming

### Default theme (combined providers)

```tsx
import { UIProvider } from "@agenticverdict/ui";

function App() {
  return <UIProvider>{/* ... */}</UIProvider>;
}
```

### Custom brand tokens

```tsx
import { UIProvider } from "@agenticverdict/ui";
import type { BrandTokens } from "@agenticverdict/ui/tokens";

const customTheme: BrandTokens = {
  colors: {
    primary: "#FF6B35",
    secondary: "#6C757D",
    success: "#2E7D32",
    warning: "#ED6C02",
    danger: "#D32F2F",
    info: "#0288D1",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
  branding: {
    appName: "My App",
  },
};

function App() {
  return <UIProvider theme={{ initialTheme: customTheme }}>{/* ... */}</UIProvider>;
}
```

## RTL support

```tsx
import { DirectionProvider } from "@agenticverdict/ui";

function App() {
  return <DirectionProvider initialLocale="ar">{/* Arabic RTL layout */}</DirectionProvider>;
}
```

## Accessibility

Target **WCAG 2.1 AA** in app code built with Mantine and shared tokens. `Icon` and `AppShellNavList` follow the same focus and labeling patterns used in the frontend shell.

## Testing

```bash
pnpm test
pnpm test:coverage
```

## Design tokens

CSS variables are documented in `src/tokens/` and architecture docs under `/docs/architecture/ui/`.

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Support

For issues and questions, use the repository issue tracker.
