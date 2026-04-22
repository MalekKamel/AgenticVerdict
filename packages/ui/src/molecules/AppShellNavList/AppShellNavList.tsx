"use client";

import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export type AppShellNavListItem = {
  id: string;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onPrefetch?: () => void;
  icon?: React.ReactNode;
};

export type AppShellNavListProps = {
  items: readonly AppShellNavListItem[];
  className?: string;
  "aria-label"?: string;
};

function NavItemButton({
  item,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { item: AppShellNavListItem }) {
  return (
    <button
      type="button"
      className={clsx(
        "group flex items-center gap-3 w-full rounded-lg px-4 py-3 text-start text-sm transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mantine-color-blue-6)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mantine-color-body)]",
        item.isActive
          ? "bg-[var(--mantine-color-blue-light)] font-semibold text-[var(--mantine-color-blue-light-color)] shadow-sm"
          : "bg-transparent font-medium text-[var(--mantine-color-text)] hover:bg-[var(--mantine-color-default-hover)] hover:shadow-sm",
        item.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      aria-current={item.isActive ? "page" : undefined}
      disabled={item.disabled}
      onClick={item.onSelect}
      onMouseEnter={item.onPrefetch}
      onFocus={item.onPrefetch}
      {...props}
    >
      {item.icon && (
        <span
          className="flex-shrink-0 text-[var(--mantine-color-dimmed)] group-hover:text-[var(--mantine-color-text)] group-aria-[current=page]:text-[var(--mantine-color-blue-light-color)]"
          aria-hidden="true"
        >
          {item.icon}
        </span>
      )}
      <span className="min-w-0 flex-1 text-start">{item.label}</span>
      {item.isActive && (
        <span
          className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--mantine-color-blue-filled)]"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export function AppShellNavList({ items, className, ...props }: AppShellNavListProps) {
  return (
    <nav className={clsx("flex flex-col gap-2", className)} {...props}>
      {items.map((item) => (
        <NavItemButton key={item.id} item={item} />
      ))}
    </nav>
  );
}
