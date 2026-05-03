/**
 * Default Postgres URL for local Docker Compose (`docker-compose.yml`).
 * Used when `DATABASE_URL` is unset so CLI tools match `drizzle-kit push` behavior.
 * Set `DATABASE_URL` explicitly for non-default hosts, CI, and any shared environment.
 */
export const LOCAL_COMPOSE_POSTGRES_URL =
  "postgresql://postgres:postgres@localhost:5432/agenticverdict";
