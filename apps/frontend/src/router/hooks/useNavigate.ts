/* eslint-disable @typescript-eslint/no-explicit-any -- Router navigation requires type coercion */
import { useNavigate as useTanStackNavigate } from "@tanstack/react-router";

import { useLocaleParam } from "./useLocaleParam";

import { withLocalePrefix } from "../utils/navigation";

export function useNavigate() {
  const tanStackNavigate = useTanStackNavigate();
  const locale = useLocaleParam();

  return {
    push: (to: string) => {
      tanStackNavigate({ to: withLocalePrefix(locale, to) as any });
    },
    replace: (to: string) => {
      tanStackNavigate({ to: withLocalePrefix(locale, to) as any, replace: true });
    },
  };
}
