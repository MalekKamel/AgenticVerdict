type JsonValidator<T> = (value: unknown) => value is T;

type StorageReporter = (event: {
  operation: "get" | "set" | "remove" | "parse";
  key: string;
  reason: "unavailable" | "exception" | "validation_failed";
  error?: unknown;
}) => void;

type VersionedEnvelope<T> = {
  v: number;
  data: T;
};

let reporter: StorageReporter | null = null;

export function setStorageReporter(nextReporter: StorageReporter | null): void {
  reporter = nextReporter;
}

function report(event: Parameters<StorageReporter>[0]): void {
  try {
    reporter?.(event);
  } catch {
    // Swallow reporter errors to keep storage calls side-effect safe.
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = window.localStorage;
    const probeKey = "__av_storage_probe__";
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    return storage;
  } catch (error) {
    report({
      operation: "get",
      key: "__availability__",
      reason: "unavailable",
      error,
    });
    return null;
  }
}

export function getStorageItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) {
    report({ operation: "get", key, reason: "unavailable" });
    return null;
  }

  try {
    return storage.getItem(key);
  } catch (error) {
    report({ operation: "get", key, reason: "exception", error });
    return null;
  }
}

export function setStorageItem(key: string, value: string): boolean {
  const storage = getStorage();
  if (!storage) {
    report({ operation: "set", key, reason: "unavailable" });
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    report({ operation: "set", key, reason: "exception", error });
    return false;
  }
}

export function removeStorageItem(key: string): boolean {
  const storage = getStorage();
  if (!storage) {
    report({ operation: "remove", key, reason: "unavailable" });
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    report({ operation: "remove", key, reason: "exception", error });
    return false;
  }
}

export function getStorageJson<T>(
  key: string,
  fallback: T,
  options?: { validate?: JsonValidator<T> },
): T {
  const raw = getStorageItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (options?.validate && !options.validate(parsed)) {
      report({ operation: "parse", key, reason: "validation_failed" });
      return fallback;
    }
    return parsed as T;
  } catch (error) {
    report({ operation: "parse", key, reason: "exception", error });
    return fallback;
  }
}

export function setStorageJson<T>(key: string, value: T): boolean {
  try {
    return setStorageItem(key, JSON.stringify(value));
  } catch (error) {
    report({ operation: "set", key, reason: "exception", error });
    return false;
  }
}

export function getVersionedStorageJson<T>(
  key: string,
  currentVersion: number,
  fallback: T,
  options?: {
    validate?: JsonValidator<T>;
    migrate?: (payload: unknown, version: number) => T | null;
  },
): T {
  const envelope = getStorageJson<VersionedEnvelope<unknown> | unknown>(key, fallback as unknown);
  if (
    typeof envelope !== "object" ||
    envelope === null ||
    !("v" in envelope) ||
    !("data" in envelope)
  ) {
    if (options?.validate && options.validate(envelope)) {
      return envelope;
    }
    return fallback;
  }

  const versioned = envelope as VersionedEnvelope<unknown>;
  if (versioned.v === currentVersion) {
    if (options?.validate && !options.validate(versioned.data)) {
      report({ operation: "parse", key, reason: "validation_failed" });
      return fallback;
    }
    return versioned.data as T;
  }

  if (!options?.migrate) {
    return fallback;
  }

  const migrated = options.migrate(versioned.data, versioned.v);
  if (migrated === null) {
    return fallback;
  }
  return migrated;
}

export function setVersionedStorageJson<T>(key: string, version: number, value: T): boolean {
  return setStorageJson(key, { v: version, data: value });
}
