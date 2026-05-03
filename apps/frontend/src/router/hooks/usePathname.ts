import { useRouterState } from "@tanstack/react-router";

import { useLocaleParam } from "./useLocaleParam";

import { stripLocalePrefix } from "../utils/navigation";

export function usePathname(): string {
  const locale = useLocaleParam();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return stripLocalePrefix(pathname, locale);
}
