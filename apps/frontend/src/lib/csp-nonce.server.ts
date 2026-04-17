import { AsyncLocalStorage } from "node:async_hooks";

const cspNonceStorage = new AsyncLocalStorage<string>();

export function getCspNonce(): string | undefined {
  return cspNonceStorage.getStore();
}

export function runWithCspNonce<T>(nonce: string, fn: () => T): T {
  return cspNonceStorage.run(nonce, fn);
}
