/* eslint-disable @typescript-eslint/no-explicit-any -- Router params require type coercion */
import { useParams as useTanStackParams } from "@tanstack/react-router";

export function useParams<TFrom extends string>(opts?: {
  from?: TFrom;
  strict?: boolean;
}): unknown {
  return useTanStackParams(opts as any);
}
