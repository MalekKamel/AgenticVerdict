/* eslint-disable @typescript-eslint/no-explicit-any -- Router search requires type coercion */
import { useSearch as useTanStackSearch } from "@tanstack/react-router";

export function useSearch<TFrom extends string>(opts?: {
  from?: TFrom;
  strict?: boolean;
}): unknown {
  return useTanStackSearch(opts as any);
}
