# Platform adapters — authentication guides

All production tokens must be **encrypted at rest** in the database and decrypted only inside trusted services. The adapter layer accepts plain string maps for testing and for in-process wiring after decryption.

Credential **key names** below match the exported `*CredentialKeys` constants in code.

---

## Meta (Facebook / Instagram Marketing API)

### Prerequisites

- Meta developer app with Marketing API product.
- Ad account id (`act_...` or numeric, normalized by `normalizeMetaAdAccountId`).
- User/system user token with ads read permissions appropriate to your use case.

### OAuth outline

1. Send the user through Meta Login for Business / OAuth dialog with required `scope` values for ads insights (per current Meta documentation for your app type).
2. Exchange the short-lived token for a **long-lived** user token when applicable.
3. Optionally pass `appId`, `appSecret`, and `refreshToken` **or** `tokenToExchange` into `authenticate()` so the adapter can call `exchangeMetaLongLivedToken` (see `meta/oauth.ts`).
4. Store the resulting **access token** securely; refresh per Meta’s rotation rules before expiry.

### `PlatformCredentials` keys (`metaCredentialKeys`)

| Key                                 | Required     | Purpose                                                   |
| ----------------------------------- | ------------ | --------------------------------------------------------- |
| `adAccountId`                       | Yes          | Target ad account.                                        |
| `accessToken`                       | Yes\*        | Bearer for Graph API. \*Or supply exchange triplet below. |
| `appId`                             | For exchange | Meta app id.                                              |
| `appSecret`                         | For exchange | Meta app secret.                                          |
| `refreshToken` or `tokenToExchange` | For exchange | Input to long-lived exchange.                             |

### Verification

Call `validateMetaAccessToken` (exported from `meta/oauth.ts`) after obtain or refresh.

---

## Google (GA4, GSC, GBP)

Google adapters share patterns: **OAuth 2.0** with refresh token, `accessToken` for bearer calls, and optional inline refresh when `clientId`, `clientSecret`, and `refreshToken` are present (`refreshGoogleAccessToken` / platform-specific wrappers in `google/oauth.ts`).

### GA4 (`ga4CredentialKeys`)

| Key                                        | Required    | Purpose                                                            |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------ |
| `propertyId`                               | Yes         | GA4 property id or `properties/{id}` form (normalized in adapter). |
| `accessToken`                              | Yes\*       | \*Or refresh triplet below.                                        |
| `clientId`, `clientSecret`, `refreshToken` | For refresh | Server-side refresh flow.                                          |

Ensure the OAuth client has access to the Analytics Data API and the service account or user is granted on the property.

### GSC (`gscCredentialKeys`)

| Key             | Required | Purpose                                                          |
| --------------- | -------- | ---------------------------------------------------------------- |
| `siteUrl`       | Yes      | Verified property URL or prefix as registered in Search Console. |
| `accessToken`   | Yes\*    | \*Or refresh triplet.                                            |
| `inspectionUrl` | No       | Optional URL for URL inspection feature in raw payload.          |

Respect the **16-month** search analytics history limit (`assertGscSearchAnalyticsDateRange`).

### GBP (`gbpCredentialKeys`)

| Key                   | Required | Purpose                                                     |
| --------------------- | -------- | ----------------------------------------------------------- |
| `accessToken`         | Yes\*    | \*Or refresh triplet.                                       |
| `accountResourceName` | No       | `accounts/{id}` to scope listing for multi-account tenants. |

Grant Business Profile APIs and appropriate OAuth scopes per Google’s current GBP documentation.

---

## TikTok Marketing API (`tiktokCredentialKeys`)

### Prerequisites

- TikTok developer app, advertiser id, and approved Marketing API access (production or sandbox).

### OAuth outline

1. User authorization → obtain `authCode` **or** use existing `refreshToken`.
2. If `appId`, `appSecret`, and `authCode` are set, adapter exchanges via `tiktokOauth2AccessToken` (`grant_type=authorization_code`).
3. If `refreshToken` is set, adapter uses refresh grant (`tiktok/oauth.ts`).
4. `validateTikTokAccessToken` confirms token before fetch.

### Keys

| Key                  | Required           | Purpose                                 |
| -------------------- | ------------------ | --------------------------------------- |
| `advertiserId`       | Yes                | Advertiser scope for reports and lists. |
| `accessToken`        | Yes\*              | \*Or OAuth exchange inputs.             |
| `appId`, `appSecret` | For token exchange | App credentials.                        |
| `authCode`           | One-time           | Authorization code grant.               |
| `refreshToken`       | Alternative        | Refresh grant.                          |
| `sandbox`            | No                 | String `"true"` to use sandbox hosts.   |

---

## Rotation and incident checklist

1. Revoke compromised tokens at the vendor console.
2. Issue new OAuth tokens; update encrypted credential rows per tenant.
3. Clear or wait out adapter cache TTL for affected platforms if stale data is unacceptable.
4. Watch `deadLetterQueue` size via `/api/health/adapters` and metrics backlog rules in [MONITORING-GUIDE.md](./MONITORING-GUIDE.md).
