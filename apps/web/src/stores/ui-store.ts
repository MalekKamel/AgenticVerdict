import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";

type UiStore = {
  leadFormSubmitted: boolean;
  setLeadFormSubmitted: (value: boolean) => void;
};

export const uiStore = new Store<UiStore>({
  leadFormSubmitted: false,
  setLeadFormSubmitted: (leadFormSubmitted) => {
    uiStore.state = { ...uiStore.state, leadFormSubmitted };
  },
});

// Type-safe selector hook
export function useUiStore<T>(selector: (store: UiStore) => T): T {
  return useStore(uiStore, selector);
}
