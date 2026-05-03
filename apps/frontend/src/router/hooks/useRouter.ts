import { useRouter as useTanStackRouter } from "@tanstack/react-router";

import { router } from "../router";

export function useRouter() {
  return useTanStackRouter<typeof router>();
}
