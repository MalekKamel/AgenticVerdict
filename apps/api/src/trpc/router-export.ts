/**
 * Web and other clients import `AppRouter` from here for end-to-end tRPC typing.
 * This module does not register HTTP adapters; it only exports the router type.
 */
export { appRouter, type AppRouter } from "./root";
