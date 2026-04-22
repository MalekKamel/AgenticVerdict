"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type AppShellBreadcrumb = {
  label: string;
  href?: string;
};

type AppShellContextValue = {
  breadcrumbs: AppShellBreadcrumb[];
  setBreadcrumbs: Dispatch<SetStateAction<AppShellBreadcrumb[]>>;
  headerContext: ReactNode;
  setHeaderContext: Dispatch<SetStateAction<ReactNode>>;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellContextProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<AppShellBreadcrumb[]>([]);
  const [headerContext, setHeaderContext] = useState<ReactNode>(null);

  const value = useMemo(
    () => ({
      breadcrumbs,
      setBreadcrumbs,
      headerContext,
      setHeaderContext,
    }),
    [breadcrumbs, headerContext],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShellContext(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShellContext must be used within AppShellContextProvider");
  }
  return context;
}

export function useAppShellHeader(options: {
  breadcrumbs?: AppShellBreadcrumb[];
  headerContext?: ReactNode;
}) {
  const { setBreadcrumbs, setHeaderContext } = useAppShellContext();
  const breadcrumbs = options.breadcrumbs ?? [];
  const headerContext = options.headerContext ?? null;

  useEffect(() => {
    setBreadcrumbs((prev) => {
      const isSame =
        prev.length === breadcrumbs.length &&
        prev.every((item, index) => {
          const nextItem = breadcrumbs[index];
          return item.label === nextItem?.label && item.href === nextItem?.href;
        });

      return isSame ? prev : breadcrumbs;
    });
    return () => setBreadcrumbs([]);
  }, [breadcrumbs, setBreadcrumbs]);

  useEffect(() => {
    setHeaderContext(headerContext);
    return () => setHeaderContext(null);
  }, [headerContext, setHeaderContext]);
}
