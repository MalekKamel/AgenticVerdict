import { AsyncLocalStorage } from "node:async_hooks";

const cspNonceStorage =
  typeof AsyncLocalStorage === "function" ? new AsyncLocalStorage<string>() : undefined;

export function getCspNonce(): string | undefined {
  return cspNonceStorage?.getStore();
}

export function runWithCspNonce<T>(nonce: string, fn: () => T): T {
  if (!cspNonceStorage) {
    return fn();
  }
  return cspNonceStorage.run(nonce, fn);
}
