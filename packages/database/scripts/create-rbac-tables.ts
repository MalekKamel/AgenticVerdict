import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/schema/index";
import { LOCAL_COMPOSE_POSTGRES_URL } from "../src/local-postgres-default-url";

async function main() {
  const client = postgres(LOCAL_COMPOSE_POSTGRES_URL, { max: 5 });
  const db = drizzle(client, { schema });

  console.log("Creating RBAC tables...");

  // Create permissions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(256) NOT NULL UNIQUE,
      resource varchar(128) NOT NULL,
      action varchar(64) NOT NULL,
      description varchar(512),
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log("✓ permissions table created");

  // Create roles table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name varchar(128) NOT NULL,
      description varchar(512),
      is_system_role boolean NOT NULL DEFAULT false,
      is_custom_role boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT roles_tenant_id_name_unique UNIQUE (tenant_id, name)
    );
  `);
  console.log("✓ roles table created");

  // Create user_roles table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      granted_by uuid REFERENCES users(id),
      granted_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz,
      CONSTRAINT user_roles_user_id_role_id_unique UNIQUE (user_id, role_id)
    );
  `);
  console.log("✓ user_roles table created");

  // Create role_permissions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      granted_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT role_permissions_role_id_permission_id_unique UNIQUE (role_id, permission_id)
    );
  `);
  console.log("✓ role_permissions table created");

  // Create indexes
  await db.execute(`
    CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON user_roles(role_id);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS role_permissions_role_id_idx ON role_permissions(role_id);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON role_permissions(permission_id);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS roles_tenant_id_idx ON roles(tenant_id);
  `);
  console.log("✓ indexes created");

  await client.end();
  console.log("\nAll RBAC tables created successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
