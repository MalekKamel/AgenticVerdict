import { describe, expect, it } from "vitest";

import { toPersistedRegisterDraft } from "./RegisterForm";

describe("RegisterForm draft persistence", () => {
  it("strips password fields from persisted payload", () => {
    const persisted = toPersistedRegisterDraft({
      accountType: "business",
      tenantName: "Acme",
      tenantWebsite: "https://acme.example",
      tenantSize: "1-10",
      email: "owner@acme.example",
      password: "SuperSecret#1",
      confirmPassword: "SuperSecret#1",
      firstName: "A",
      lastName: "B",
      acceptTerms: true,
      inviteCode: "invite-code",
      plan: "pro",
    });

    expect(persisted).not.toHaveProperty("password");
    expect(persisted).not.toHaveProperty("confirmPassword");
    expect(persisted).toMatchObject({
      accountType: "business",
      tenantName: "Acme",
      email: "owner@acme.example",
      acceptTerms: true,
    });
  });
});
