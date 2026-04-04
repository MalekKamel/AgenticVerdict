import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";

import { runMigrations } from "../src/migrate";

const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

describe("PostgreSQL RLS (tenant isolation)", () => {
  let container: StartedPostgreSqlContainer | undefined;
  let rls: ReturnType<typeof postgres> | undefined;

  beforeAll(async () => {
    const started = await new PostgreSqlContainer("postgres:16-alpine").start();
    try {
      const adminUrl = started.getConnectionUri();
      await runMigrations(adminUrl);

      const admin = postgres(adminUrl, { max: 1 });
      try {
        await admin.unsafe(`DROP ROLE IF EXISTS av_rls_tester`);
        await admin.unsafe(`CREATE ROLE av_rls_tester WITH LOGIN PASSWORD 'rls_test_secret'`);
        const database = started.getDatabase();
        await admin.unsafe(`GRANT CONNECT ON DATABASE "${database}" TO av_rls_tester`);
        await admin.unsafe(`GRANT USAGE ON SCHEMA public TO av_rls_tester`);
        await admin.unsafe(
          `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO av_rls_tester`,
        );
      } finally {
        await admin.end({ timeout: 10 });
      }

      const rlsUrl = `postgresql://av_rls_tester:rls_test_secret@${started.getHost()}:${started.getMappedPort(5432)}/${started.getDatabase()}`;
      rls = postgres(rlsUrl, { max: 4 });
      container = started;
    } catch (err) {
      await started.stop();
      throw err;
    }
  }, 180_000);

  afterAll(async () => {
    if (rls) {
      await rls.end({ timeout: 10 });
    }
    if (container) {
      await container.stop();
    }
  });

  it("allows each tenant to manage only their company row", async () => {
    if (!rls) {
      throw new Error("RLS client not initialized");
    }
    await rls.begin(async (sql) => {
      await sql`select set_config('app.current_tenant_id', ${TENANT_A}, true)`;
      await sql`
        insert into companies (id, name, slug)
        values (${TENANT_A}, 'Tenant A', 'tenant-a')
      `;
    });

    await rls.begin(async (sql) => {
      await sql`select set_config('app.current_tenant_id', ${TENANT_B}, true)`;
      await sql`
        insert into companies (id, name, slug)
        values (${TENANT_B}, 'Tenant B', 'tenant-b')
      `;
    });

    const visibleToA = await rls.begin(async (sql) => {
      await sql`select set_config('app.current_tenant_id', ${TENANT_A}, true)`;
      return sql<{ id: string }>`select id::text from companies`;
    });
    expect(visibleToA.map((r) => r.id)).toEqual([TENANT_A]);

    const visibleToB = await rls.begin(async (sql) => {
      await sql`select set_config('app.current_tenant_id', ${TENANT_B}, true)`;
      return sql<{ id: string }>`select id::text from companies`;
    });
    expect(visibleToB.map((r) => r.id)).toEqual([TENANT_B]);
  });

  it("hides other tenants' users and blocks cross-tenant inserts", async () => {
    if (!rls) {
      throw new Error("RLS client not initialized");
    }
    const userId = await rls.begin(async (sql) => {
      await sql`select set_config('app.current_tenant_id', ${TENANT_A}, true)`;
      const [row] = await sql<{ id: string }>`
        insert into users (company_id, email)
        values (${TENANT_A}, 'owner@tenant-a.test')
        returning id::text
      `;
      return row.id;
    });

    const peekAsB = await rls.begin(async (sql) => {
      await sql`select set_config('app.current_tenant_id', ${TENANT_B}, true)`;
      return sql<{ id: string }>`select id::text from users where id = ${userId}`;
    });
    expect(peekAsB).toHaveLength(0);

    await expect(
      rls.begin(async (sql) => {
        await sql`select set_config('app.current_tenant_id', ${TENANT_B}, true)`;
        await sql`
          insert into users (company_id, email)
          values (${TENANT_A}, 'evil@tenant-b.test')
        `;
      }),
    ).rejects.toThrow();
  });
});
