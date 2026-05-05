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
  headerContext: ReactNode;
};

type AppShellActionsContextValue = {
  setBreadcrumbs: Dispatch<SetStateAction<AppShellBreadcrumb[]>>;
  setHeaderContext: Dispatch<SetStateAction<ReactNode>>;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);
const AppShellActionsContext = createContext<AppShellActionsContextValue | null>(null);

export function AppShellContextProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<AppShellBreadcrumb[]>([]);
  const [headerContext, setHeaderContext] = useState<ReactNode>(null);

  const stateValue = useMemo(
    () => ({
      breadcrumbs,
      headerContext,
    }),
    [breadcrumbs, headerContext],
  );

  const actionsValue = useMemo(
    () => ({
      setBreadcrumbs,
      setHeaderContext,
    }),
    [setBreadcrumbs, setHeaderContext],
  );

  return (
    <AppShellActionsContext.Provider value={actionsValue}>
      <AppShellContext.Provider value={stateValue}>{children}</AppShellContext.Provider>
    </AppShellActionsContext.Provider>
  );
}

export function useAppShellContext(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShellContext must be used within AppShellContextProvider");
  }
  return context;
}

function useAppShellActionsContext(): AppShellActionsContextValue {
  const context = useContext(AppShellActionsContext);
  if (!context) {
    throw new Error("useAppShellActionsContext must be used within AppShellContextProvider");
  }
  return context;
}

export function useAppShellHeader(options: {
  breadcrumbs?: AppShellBreadcrumb[];
  headerContext?: ReactNode;
}) {
  const { setBreadcrumbs, setHeaderContext } = useAppShellActionsContext();
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
  }, [breadcrumbs, setBreadcrumbs]);

  useEffect(() => {
    setHeaderContext(headerContext);
  }, [headerContext, setHeaderContext]);

  useEffect(() => {
    return () => {
      setBreadcrumbs([]);
      setHeaderContext(null);
    };
  }, [setBreadcrumbs, setHeaderContext]);
}
