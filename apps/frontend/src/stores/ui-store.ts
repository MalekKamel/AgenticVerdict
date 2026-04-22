import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";

interface UiState {
  leadFormSubmitted: boolean;
}

// Initial state
const initialUiState: UiState = {
  leadFormSubmitted: false,
};

// Create the store
export const uiStore = new Store<UiState>(initialUiState);

// React hook to use the ui store
export function useUiStore<T>(selector: (state: UiState) => T): T {
  return useStore(uiStore, selector);
}

// Store actions
export const uiActions = {
  setLeadFormSubmitted: (leadFormSubmitted: boolean) => {
    uiStore.setState((prev: UiState) => ({
      ...prev,
      leadFormSubmitted,
    }));
  },
};
