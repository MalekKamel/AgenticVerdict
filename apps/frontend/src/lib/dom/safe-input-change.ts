import type { ChangeEvent } from "react";

function inputEl(e: ChangeEvent<HTMLInputElement>): HTMLInputElement | null {
  return e.currentTarget ?? (e.target as HTMLInputElement | null);
}

/** When `currentTarget` is null (seen with React 19 + some Mantine paths), fall back to `target`. */
export function inputValueFromChangeEvent(e: ChangeEvent<HTMLInputElement>): string {
  return inputEl(e)?.value ?? "";
}

export function inputCheckedFromChangeEvent(e: ChangeEvent<HTMLInputElement>): boolean {
  return inputEl(e)?.checked ?? false;
}
