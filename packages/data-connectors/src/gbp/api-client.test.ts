import { describe, expect, it, vi } from "vitest";

import { PlatformAuthError, PlatformError } from "../errors";
import {
  gbpGetJson,
  gbpListAllAccounts,
  gbpListAllLocationsForAccount,
  isoDateToGoogleCalendar,
  locationIdFromResourceName,
} from "./api-client";

describe("isoDateToGoogleCalendar", () => {
  it("parses YYYY-MM-DD", () => {
    expect(isoDateToGoogleCalendar("2025-06-15")).toEqual({ year: 2025, month: 6, day: 15 });
  });

  it("throws on invalid input", () => {
    expect(() => isoDateToGoogleCalendar("06-15-2025")).toThrow(PlatformError);
  });
});

describe("locationIdFromResourceName", () => {
  it("extracts the locations segment", () => {
    expect(locationIdFromResourceName("accounts/1/locations/99")).toBe("99");
  });

  it("returns null when missing", () => {
    expect(locationIdFromResourceName("accounts/1")).toBeNull();
  });
});

describe("gbpGetJson", () => {
  it("throws on error responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Denied" } }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(
      gbpGetJson("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
        accessToken: "t",
        fetchImpl,
      }),
    ).rejects.toThrow(PlatformAuthError);
  });
});

describe("gbpListAllAccounts pagination", () => {
  it("follows nextPageToken", async () => {
    let n = 0;
    const fetchImpl = vi.fn().mockImplementation(() => {
      n += 1;
      const body =
        n === 1
          ? { accounts: [{ name: "accounts/1" }], nextPageToken: "p2" }
          : { accounts: [{ name: "accounts/2" }] };
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    const rows = await gbpListAllAccounts({ accessToken: "t", fetchImpl });
    expect(rows.map((a) => a.name)).toEqual(["accounts/1", "accounts/2"]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("gbpListAllLocationsForAccount pagination", () => {
  it("follows nextPageToken", async () => {
    let n = 0;
    const fetchImpl = vi.fn().mockImplementation(() => {
      n += 1;
      const body =
        n === 1
          ? {
              locations: [{ name: "accounts/1/locations/a" }],
              nextPageToken: "t2",
            }
          : { locations: [{ name: "accounts/1/locations/b" }] };
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    const locs = await gbpListAllLocationsForAccount("accounts/1", { accessToken: "x", fetchImpl });
    expect(locs).toHaveLength(2);
  });
});
