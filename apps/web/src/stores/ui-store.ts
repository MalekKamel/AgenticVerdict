import { create } from "TanStack Store";

type UiStore = {
  leadFormSubmitted: boolean;
  setLeadFormSubmitted: (value: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  leadFormSubmitted: false,
  setLeadFormSubmitted: (leadFormSubmitted) => set({ leadFormSubmitted }),
}));
