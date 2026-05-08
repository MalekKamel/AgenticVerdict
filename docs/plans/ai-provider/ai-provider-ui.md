# Phase 2: Provider Expansion

**Duration:** 3 weeks  
**Effort:** 22 person-days  
**Dependencies:** Phase 1 complete

---

## Goal

Build frontend UI for provider/credential management following Lobe Chat patterns.

---

## Tasks

### Task 2.1: Credential Management API Endpoints

**Priority:** 🔴 Critical  
**Effort:** 3 days  
**Dependencies:** Phase 1 complete  
**Files:** `apps/api/src/trpc/routers/ai-providers.ts`

**Acceptance Criteria:**

- [ ] `createCredential` endpoint
- [ ] `getCredential` endpoint (returns masked value)
- [ ] `updateCredential` endpoint
- [ ] `deleteCredential` endpoint
- [ ] `testCredential` endpoint (connection test)
- [ ] All endpoints tenant-scoped

**API Design:**

```typescript
export const aiProviderRouter = createRouter().procedure("createCredential", {
  input: z.object({
    providerId: z.string(),
    credentials: z.record(z.string()),
  }),
  handler: async ({ ctx, input }) => {
    await credentialManager.storeCredential(ctx.tenantId, input.providerId, input.credentials);
  },
});
```

**Testing:**

- API integration tests
- Tenant isolation tests

---

### Task 2.2: Provider Selection UI (Grid Layout)

**Priority:** 🔴 Critical  
**Effort:** 4 days  
**Dependencies:** Task 2.1  
**Files:** `apps/frontend/src/features/settings/providers/`

**Acceptance Criteria:**

- [ ] Provider grid with cards
- [ ] Enable/disable toggle per provider
- [ ] Provider logos and descriptions
- [ ] Navigation to provider detail
- [ ] Responsive layout

**Component Structure:**

```
apps/frontend/src/features/settings/providers/
├── ProvidersPage.tsx          # Main page
├── ProviderGrid.tsx           # Grid layout
├── ProviderCard.tsx           # Individual card
├── ProviderEnableSwitch.tsx   # Toggle
└── provider-utils.ts          # Helpers
```

**Testing:**

- Component tests
- E2E test: Enable/disable provider

---

### Task 2.3: Provider Configuration Form

**Priority:** 🔴 Critical  
**Effort:** 5 days  
**Dependencies:** Task 2.2  
**Files:** `apps/frontend/src/features/settings/providers/ProviderConfigForm.tsx`

**Acceptance Criteria:**

- [ ] Dynamic form fields based on provider
- [ ] API key input with show/hide toggle
- [ ] BaseURL configuration
- [ ] Provider-specific fields (e.g., AWS region for Bedrock)
- [ ] Real-time validation
- [ ] Save/cancel actions

**Implementation:**

```typescript
const providerFieldConfigs: Record<string, ProviderField[]> = {
  openai: [{ name: "apiKey", type: "password", required: true, label: "API Key" }],
  bedrock: [
    { name: "accessKeyId", type: "text", required: true },
    { name: "secretAccessKey", type: "password", required: true },
    { name: "region", type: "select", options: AWS_REGIONS },
  ],
};
```

**Testing:**

- Form validation tests
- Submission tests

---

### Task 2.4: Connection Testing UI

**Priority:** 🟡 High  
**Effort:** 3 days  
**Dependencies:** Task 2.3  
**Files:** `apps/frontend/src/features/settings/providers/ConnectionChecker.tsx`

**Acceptance Criteria:**

- [ ] Model dropdown for test selection
- [ ] Test connection button
- [ ] Loading state with spinner
- [ ] Success indicator (green checkmark)
- [ ] Error display with details

**Testing:**

- Component tests
- Integration test with API

---

### Task 2.5: Model Management UI

**Priority:** 🔴 Critical  
**Effort:** 5 days  
**Dependencies:** Task 2.6  
**Files:** `apps/frontend/src/features/settings/providers/ModelList.tsx`

**Acceptance Criteria:**

- [ ] Model list with enable/disable toggles
- [ ] Type-based tabs (chat, image, video, etc.)
- [ ] Search functionality
- [ ] Model details (context window, abilities)
- [ ] Custom model creation modal
- [ ] Model sorting/reordering

**Component Structure:**

```
ModelList/
├── index.tsx                  # Container
├── ModelItem.tsx              # Row component
├── EnabledModelList.tsx       # Enabled section
├── DisabledModels.tsx         # Disabled section
├── CreateNewModelModal.tsx    # Add custom model
├── ModelConfigModal.tsx       # Edit config
└── SortModelModal.tsx         # Reorder
```

**Testing:**

- Component tests
- E2E: Add custom model

---

### Task 2.6: Dynamic Model Discovery API

**Priority:** 🟡 High  
**Effort:** 3 days  
**Dependencies:** Task 1.1  
**Files:** `apps/api/src/trpc/routers/ai-providers.ts`

**Acceptance Criteria:**

- [ ] `listModels` endpoint per provider
- [ ] Model capabilities returned (context window, abilities)
- [ ] Caching to reduce API calls
- [ ] Error handling for unavailable providers

**API Design:**

```typescript
export const listModelsProcedure = createRouter().procedure("listModels", {
  input: z.object({ providerId: z.string() }),
  handler: async ({ ctx, input }) => {
    const provider = ProviderFactory.create(input.providerId, config);
    const models = await provider.listModels();
    return models.map(normalizeModel);
  },
});
```

**Testing:**

- API integration tests
- Caching tests

---

### Task 2.7: Budget Management UI

**Priority:** 🟡 High  
**Effort:** 3 days  
**Dependencies:** Task 2.1  
**Files:** `apps/frontend/src/features/settings/billing/BudgetSettings.tsx`

**Acceptance Criteria:**

- [ ] Monthly budget configuration
- [ ] Alert threshold slider
- [ ] Hard/soft limit toggle
- [ ] Usage progress bar
- [ ] Reset button

**Testing:**

- Component tests
- Integration with billing hook

---

## Phase 2 Deliverables

- [ ] Credential management API complete
- [ ] Provider selection UI deployed
- [ ] Provider configuration form working
- [ ] Connection testing functional
- [ ] Model management UI complete
- [ ] Budget management UI deployed

---

## Phase 2 Exit Criteria

- [ ] 7+ providers configurable via UI
- [ ] Performance benchmarks met (p95 latency <2s)
- [ ] Monitoring dashboard functional
- [ ] Zero high-priority bugs

---

## Next Phase

→ Proceed to [Phase 3: Agent Integration](./03-phase-3-agent-integration.md)
