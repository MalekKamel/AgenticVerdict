# AI Provider UI Implementation Plan

**Based on:** Lobe Chat Analysis (`lobe-chat-analysis.md`)  
**Duration:** 3 weeks  
**Effort:** 22 person-days  
**Phase:** Phase 2 - Provider Expansion

---

## Overview

This implementation plan adapts Lobe Chat's production-grade AI provider UI patterns for AgenticVerdict's multi-tenant architecture. The plan follows Lobe Chat's architecture while simplifying non-essential features for MVP.

---

## Architecture Adaptation

### 1. Key Differences from Lobe Chat

| Aspect         | Lobe Chat              | AgenticVerdict               |
| -------------- | ---------------------- | ---------------------------- |
| **User Scope** | Single user (`userId`) | Multi-tenant (`tenantId`)    |
| **State**      | Zustand + SWR          | TanStack Query (React Query) |
| **UI Library** | @lobehub/ui            | Mantine + packages/ui        |
| **API**        | tRPC (lambda/async)    | tRPC (single router)         |
| **Encryption** | KeyVaultsGateKeeper    | packages/core/crypto         |

### 2. Mapping Strategy

```
Lobe Chat                    →  AgenticVerdict
─────────────────────────────────────────────────
src/server/routers/lambda    →  apps/api/src/trpc/routers
src/services/aiProvider      →  apps/frontend/src/services/aiProvider
src/store/aiInfra            →  apps/frontend/src/store/aiProvider
src/features/ModelSelect     →  apps/frontend/src/features/settings/providers
packages/model-bank          →  packages/core/src/types/ai-models
```

---

## Implementation Tasks

### Task 2.1: Type System & Schemas

**Duration:** 1 day  
**Files:** `packages/core/src/types/ai-models.ts`, `packages/core/src/schemas/ai-provider.ts`

**Deliverables:**

- [ ] Define `AiModelType` enum (chat, embedding, tts, stt, image, video, realtime)
- [ ] Define `ModelAbilities` interface (vision, functionCall, reasoning, etc.)
- [ ] Define `AiProviderDetailItem` interface
- [ ] Define `EnabledProviderWithModels` interface
- [ ] Create Zod schemas for validation:
  - `CreateAiProviderSchema`
  - `UpdateAiProviderSchema`
  - `UpdateAiProviderConfigSchema`
  - `CreateAiModelSchema`
  - `UpdateAiModelSchema`
  - `ToggleAiModelEnableSchema`

**Lobe Chat Reference:**

- `packages/model-bank/src/types/aiModel.ts`
- `src/types/aiProvider.ts`

---

### Task 2.2: Database Schema & Models

**Duration:** 2 days  
**Files:** `packages/database/src/schema/ai-providers.ts`, `packages/database/src/models/`

**Deliverables:**

- [ ] Create `aiProviders` table with RLS policies
  - `id`, `tenant_id`, `name`, `source`, `enabled`, `sort`, `config` (encrypted), `fetch_on_client`
- [ ] Create `aiModels` table with RLS policies
  - `id`, `provider_id`, `tenant_id`, `type`, `enabled`, `sort`, `config`, `abilities`, `context_window_tokens`
- [ ] Implement `AiProviderModel` class with CRUD operations
- [ ] Implement `AiModelRepository` class
- [ ] Add tenant-scoped queries (use `dbScoped(tenantId)`)

**Lobe Chat Reference:**

- `src/database/models/aiProvider.ts`
- `src/database/repositories/aiInfra.ts`

**Security:**

- All queries must use tenant-scoped database access
- Credentials encrypted before storage
- RLS policies enforce tenant isolation

---

### Task 2.3: tRPC Router Implementation

**Duration:** 2 days  
**Files:** `apps/api/src/trpc/routers/ai-providers.ts`, `apps/api/src/trpc/routers/ai-models.ts`

**Deliverables:**

**AI Provider Router:**

- [ ] `createAiProvider` - Create custom provider
- [ ] `getAiProviderById` - Get provider details (returns masked config)
- [ ] `getAiProviderList` - List all providers for tenant
- [ ] `getAiProviderRuntimeState` - Get runtime state with enabled models
- [ ] `removeAiProvider` - Delete provider
- [ ] `toggleProviderEnabled` - Enable/disable provider
- [ ] `updateAiProvider` - Update provider metadata
- [ ] `updateAiProviderConfig` - Update credentials (encrypted)
- [ ] `updateAiProviderOrder` - Reorder providers
- [ ] `checkProviderConnectivity` - Test connection with model

**AI Model Router:**

- [ ] `createAiModel` - Create custom model
- [ ] `getAiModelById` - Get model details
- [ ] `getAiProviderModelList` - List models for provider
- [ ] `toggleModelEnabled` - Enable/disable model
- [ ] `updateAiModel` - Update model config
- [ ] `batchUpdateAiModels` - Bulk update models
- [ ] `batchToggleAiModels` - Bulk enable/disable
- [ ] `clearModelsByProvider` - Remove all models for provider
- [ ] `updateAiModelOrder` - Reorder models

**Lobe Chat Reference:**

- `src/server/routers/lambda/aiProvider.ts`
- `src/server/routers/lambda/aiModel.ts`

**Middleware:**

```typescript
const aiProviderProcedure = authedProcedure.use(enforceTenantIsolation).use(async (opts) => {
  const { ctx } = opts;
  const gateKeeper = await KeyVaultsGateKeeper.init();
  return opts.next({
    ctx: {
      aiProviderModel: new AiProviderModel(ctx.serverDB, ctx.tenantId),
      gateKeeper,
    },
  });
});
```

---

### Task 2.4: Service Layer (Frontend)

**Duration:** 1 day  
**Files:** `apps/frontend/src/services/aiProvider.ts`, `apps/frontend/src/services/aiModel.ts`

**Deliverables:**

**AiProviderService:**

```typescript
export class AiProviderService {
  createAiProvider: (params: CreateAiProviderParams) => Promise<string>;
  getAiProviderList: () => Promise<AiProviderListItem[]>;
  getAiProviderById: (id: string) => Promise<AiProviderDetailItem>;
  toggleProviderEnabled: (id: string, enabled: boolean) => Promise<void>;
  updateAiProvider: (id: string, value: UpdateAiProviderParams) => Promise<void>;
  updateAiProviderConfig: (id: string, value: UpdateAiProviderConfigParams) => Promise<void>;
  removeAiProvider: (id: string) => Promise<void>;
  checkProviderConnectivity: (
    id: string,
    model?: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}
```

**AiModelService:**

```typescript
export class AiModelService {
  getAiProviderModelList: (providerId: string) => Promise<AiProviderModelListItem[]>;
  toggleModelEnabled: (params: ToggleAiModelEnableParams) => Promise<void>;
  updateAiModel: (id: string, providerId: string, value: UpdateAiModelParams) => Promise<void>;
  createAiModel: (params: CreateAiModelParams) => Promise<void>;
  batchToggleAiModels: (providerId: string, modelIds: string[], enabled: boolean) => Promise<void>;
}
```

**Lobe Chat Reference:**

- `src/services/aiProvider/index.ts`
- `src/services/aiModel/index.ts`

---

### Task 2.5: State Management (TanStack Query)

**Duration:** 2 days  
**Files:** `apps/frontend/src/hooks/useAiProviders.ts`, `apps/frontend/src/hooks/useAiModels.ts`

**Deliverables:**

**Provider Hooks:**

```typescript
// useAiProviderList
export const useAiProviderList = () => {
  return useQuery({
    queryKey: ["aiProviders", "list"],
    queryFn: () => aiProviderService.getAiProviderList(),
  });
};

// useAiProviderRuntimeState
export const useAiProviderRuntimeState = () => {
  return useQuery({
    queryKey: ["aiProviders", "runtimeState"],
    queryFn: () => aiProviderService.getAiProviderRuntimeState(),
  });
};

// useToggleProviderEnabled (with optimistic update)
export const useToggleProviderEnabled = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }) => aiProviderService.toggleProviderEnabled(id, enabled),
    onMutate: async ({ id, enabled }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["aiProviders", "list"] });
      const previous = queryClient.getQueryData(["aiProviders", "list"]);
      queryClient.setQueryData(["aiProviders", "list"], (old: any) =>
        old.map((item: any) => (item.id === id ? { ...item, enabled } : item)),
      );
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(["aiProviders", "list"], context?.previous);
    },
  });
};
```

**Model Hooks:**

- Similar pattern for model operations
- Batch operations support

**Lobe Chat Reference:**

- `src/store/aiInfra/slices/aiProvider/action.ts`

---

### Task 2.6: Provider Grid Component

**Duration:** 2 days  
**Files:** `apps/frontend/src/features/settings/providers/`

**Component Structure:**

```
apps/frontend/src/features/settings/providers/
├── index.tsx                     # Export barrel
├── ProvidersPage.tsx             # Main page container
├── ProviderGrid.tsx              # Grid layout
├── ProviderCard.tsx              # Individual card
├── ProviderEnableSwitch.tsx      # Toggle switch
└── hooks/
    └── useProviderActions.ts     # Action hooks
```

**ProviderGrid.tsx:**

```typescript
interface ProviderGridProps {
  providers: AiProviderListItem[];
  onProviderClick: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}

export const ProviderGrid = ({ providers, onProviderClick, onToggleEnabled }) => {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
      {providers.map((provider) => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          onClick={() => onProviderClick(provider.id)}
          onToggle={(enabled) => onToggleEnabled(provider.id, enabled)}
        />
      ))}
    </SimpleGrid>
  );
};
```

**ProviderCard.tsx:**

```typescript
interface ProviderCardProps {
  provider: AiProviderListItem;
  onClick: () => void;
  onToggle: (enabled: boolean) => void;
}

export const ProviderCard = ({ provider, onClick, onToggle }) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Avatar src={provider.logo} alt={provider.name} />
        <ProviderEnableSwitch
          checked={provider.enabled}
          onChange={onToggle}
          loading={isLoading}
        />
      </Group>

      <Text fw={500} mb="xs">{provider.name}</Text>
      <Text c="dimmed" size="sm">{provider.source}</Text>

      {provider.configured && (
        <Badge color="green" size="sm" mt="sm">Configured</Badge>
      )}
    </Card>
  );
};
```

**Lobe Chat Reference:**

- `src/features/Setting/` patterns
- `src/components/ModelSelect/index.tsx`

---

### Task 2.7: Provider Configuration Form

**Duration:** 3 days  
**Files:** `apps/frontend/src/features/settings/providers/ProviderConfigForm.tsx`

**Deliverables:**

- [ ] Dynamic form fields based on provider type
- [ ] API key input with show/hide toggle
- [ ] BaseURL configuration
- [ ] Provider-specific fields (AWS region, etc.)
- [ ] Real-time validation with Zod
- [ ] Save/cancel actions
- [ ] Loading states

**Field Configuration:**

```typescript
const providerFieldConfigs: Record<string, ProviderField[]> = {
  openai: [{ name: "apiKey", type: "password", required: true, label: "API Key" }],
  anthropic: [{ name: "apiKey", type: "password", required: true, label: "API Key" }],
  bedrock: [
    { name: "accessKeyId", type: "text", required: true, label: "Access Key ID" },
    { name: "secretAccessKey", type: "password", required: true, label: "Secret Access Key" },
    { name: "region", type: "select", required: true, options: AWS_REGIONS },
  ],
  ollama: [{ name: "baseURL", type: "url", required: true, label: "Base URL" }],
};
```

**Form Component:**

```typescript
export const ProviderConfigForm = ({ providerId, onSuccess }) => {
  const form = useForm({
    initialValues: { apiKey: '', baseURL: '', ... },
    validate: zodResolver(providerSchema),
  });

  const { mutate: updateConfig } = useUpdateProviderConfig();

  return (
    <Form onSubmit={form.onSubmit((values) => updateConfig({ id: providerId, value: values }))}>
      {fields.map((field) => (
        <DynamicField key={field.name} {...field} form={form} />
      ))}
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isUpdating}>Save</Button>
      </Group>
    </Form>
  );
};
```

**Lobe Chat Reference:**

- Configuration form patterns from `src/features/AgentSetting/`

---

### Task 2.8: Connection Testing UI

**Duration:** 1 day  
**Files:** `apps/frontend/src/features/settings/providers/ConnectionChecker.tsx`

**Deliverables:**

- [ ] Test connection button
- [ ] Model dropdown for test selection
- [ ] Loading state with spinner
- [ ] Success indicator (green checkmark)
- [ ] Error display with details

**Component:**

```typescript
export const ConnectionChecker = ({ providerId, checkModel }) => {
  const { mutate: testConnection, isPending, error, data } = useCheckProviderConnectivity();

  const handleTest = () => {
    testConnection({ id: providerId, model: checkModel });
  };

  return (
    <Group>
      <Button onClick={handleTest} loading={isPending}>
        Test Connection
      </Button>

      {data?.ok && (
        <Badge color="green" leftSection={<IconCheck size={12} />}>
          Connected
        </Badge>
      )}

      {error && (
        <Text c="red" size="sm">{error.message}</Text>
      )}
    </Group>
  );
};
```

**Lobe Chat Reference:**

- `src/server/routers/lambda/aiProvider.ts:checkProviderConnectivity`

---

### Task 2.9: Model Management UI

**Duration:** 3 days  
**Files:** `apps/frontend/src/features/settings/providers/ModelList.tsx`

**Component Structure:**

```
ModelList/
├── index.tsx                   # Container
├── ModelItem.tsx               # Row component
├── ModelTypeTabs.tsx           # Type filter tabs
├── CreateModelModal.tsx        # Add custom model
├── ModelConfigModal.tsx        # Edit config
└── BulkActions.tsx             # Batch enable/disable
```

**Deliverables:**

- [ ] Model list with enable/disable toggles
- [ ] Type-based tabs (chat, image, video, etc.)
- [ ] Search functionality
- [ ] Model details display (context window, abilities)
- [ ] Custom model creation modal
- [ ] Bulk actions (enable all, disable all)

**ModelList Component:**

```typescript
export const ModelList = ({ providerId }) => {
  const [activeTab, setActiveTab] = useState<AiModelType>('chat');
  const [search, setSearch] = useState('');

  const { data: models } = useAiProviderModelList(providerId);

  const filteredModels = useMemo(() => {
    return models
      ?.filter(m => m.type === activeTab)
      .filter(m => m.displayName?.toLowerCase().includes(search.toLowerCase()));
  }, [models, activeTab, search]);

  return (
    <Box>
      <ModelTypeTabs value={activeTab} onChange={setActiveTab} />
      <TextInput
        placeholder="Search models..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb="md"
      />
      <Stack>
        {filteredModels?.map((model) => (
          <ModelItem key={model.id} model={model} />
        ))}
      </Stack>
    </Box>
  );
};
```

**ModelItem Component:**

```typescript
export const ModelItem = ({ model }) => {
  const { mutate: toggle } = useToggleModelEnabled();

  return (
    <Group justify="space-between" p="sm" style={{ borderBottom: '1px solid #eee' }}>
      <Group>
        <Text fw={500}>{model.displayName || model.id}</Text>
        {model.abilities?.vision && <Badge size="sm">Vision</Badge>}
        {model.abilities?.functionCall && <Badge size="sm">Functions</Badge>}
        {model.contextWindowTokens && (
          <Text c="dimmed" size="sm">{model.contextWindowTokens} tokens</Text>
        )}
      </Group>
      <Switch
        checked={model.enabled}
        onChange={(e) => toggle({ id: model.id, providerId: model.providerId, enabled: e.target.checked })}
      />
    </Group>
  );
};
```

**Lobe Chat Reference:**

- `src/features/ModelSwitchPanel/components/List/index.tsx`
- `src/features/ModelSwitchPanel/components/List/ListItemRenderer.tsx`

---

### Task 2.10: Model Select Component

**Duration:** 2 days  
**Files:** `apps/frontend/src/components/ModelSelect/index.tsx`

**Deliverables:**

- [ ] Dropdown selector with grouped options
- [ ] Provider logo display
- [ ] Model abilities badges
- [ ] Search/filter functionality
- [ ] Custom option rendering

**Component:**

```typescript
export const ModelSelect = ({ value, onChange, requiredAbilities }) => {
  const { data: providers } = useEnabledChatModels();

  const options = useMemo(() => {
    return providers?.map((provider) => ({
      group: provider.name,
      items: provider.children
        .filter(m => !requiredAbilities || hasAbilities(m, requiredAbilities))
        .map((model) => ({
          value: `${provider.id}/${model.id}`,
          label: (
            <ModelOption
              model={model}
              provider={provider}
              showAbilities={true}
            />
          ),
        })),
    }));
  }, [providers, requiredAbilities]);

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      optionComponent={ModelOption}
      searchable
    />
  );
};
```

**Lobe Chat Reference:**

- `src/features/ModelSelect/index.tsx`
- `src/components/ModelSelect/index.tsx`

---

### Task 2.11: Integration with Agent Runtime

**Duration:** 2 days  
**Files:** `apps/api/src/modules/model-runtime/`, `packages/agent-runtime/`

**Deliverables:**

- [ ] `initModelRuntimeFromDB` function
- [ ] Provider config resolution
- [ ] Credential decryption
- [ ] Error handling and fallback

**Implementation:**

```typescript
export const initModelRuntimeFromDB = async (serverDB, tenantId, providerId) => {
  const provider = await getProviderConfig(serverDB, tenantId, providerId);
  const gateKeeper = await KeyVaultsGateKeeper.init();

  const decryptedConfig = gateKeeper.decrypt(provider.config);

  return AgentRuntime.createRuntime(provider, {
    apiKey: decryptedConfig.apiKey,
    baseURL: provider.config?.baseURL,
    region: provider.config?.region,
  });
};
```

**Lobe Chat Reference:**

- `src/server/modules/ModelRuntime/index.ts`

---

### Task 2.12: Testing

**Duration:** 2 days  
**Files:** `apps/api/src/trpc/routers/__tests__/`, `apps/frontend/src/features/settings/providers/__tests__/`

**Deliverables:**

**API Tests:**

- [ ] CRUD operations for providers
- [ ] CRUD operations for models
- [ ] Tenant isolation tests
- [ ] Connection test endpoint
- [ ] Encryption/decryption tests

**Component Tests:**

- [ ] ProviderCard render and toggle
- [ ] ProviderConfigForm validation
- [ ] ModelList filtering and toggles
- [ ] ModelSelect option rendering

**E2E Tests:**

- [ ] Add new provider flow
- [ ] Configure provider credentials
- [ ] Test connection
- [ ] Enable/disable models
- [ ] Select model in chat

**Lobe Chat Reference:**

- `src/server/routers/lambda/__tests__/aiProvider.test.ts`
- `src/services/aiProvider/index.test.ts`

---

## Phase 2 Deliverables Checklist

### API Layer

- [ ] `apps/api/src/trpc/routers/ai-providers.ts` - Provider router
- [ ] `apps/api/src/trpc/routers/ai-models.ts` - Model router
- [ ] `apps/api/src/modules/model-runtime/index.ts` - Runtime integration

### Database Layer

- [ ] `packages/database/src/schema/ai-providers.ts` - Schema
- [ ] `packages/database/src/models/ai-provider-model.ts` - Provider model
- [ ] `packages/database/src/models/ai-model-repository.ts` - Model repository

### Type System

- [ ] `packages/core/src/types/ai-models.ts` - Core types
- [ ] `packages/core/src/schemas/ai-provider.ts` - Zod schemas

### Frontend Services

- [ ] `apps/frontend/src/services/aiProvider.ts` - Provider service
- [ ] `apps/frontend/src/services/aiModel.ts` - Model service

### State Management

- [ ] `apps/frontend/src/hooks/useAiProviders.ts` - Provider hooks
- [ ] `apps/frontend/src/hooks/useAiModels.ts` - Model hooks

### UI Components

- [ ] `apps/frontend/src/features/settings/providers/ProvidersPage.tsx`
- [ ] `apps/frontend/src/features/settings/providers/ProviderGrid.tsx`
- [ ] `apps/frontend/src/features/settings/providers/ProviderCard.tsx`
- [ ] `apps/frontend/src/features/settings/providers/ProviderConfigForm.tsx`
- [ ] `apps/frontend/src/features/settings/providers/ConnectionChecker.tsx`
- [ ] `apps/frontend/src/features/settings/providers/ModelList.tsx`
- [ ] `apps/frontend/src/components/ModelSelect/index.tsx`

### Tests

- [ ] API integration tests
- [ ] Component unit tests
- [ ] E2E flow tests

---

## Exit Criteria

- [ ] 7+ providers configurable via UI (OpenAI, Anthropic, Bedrock, Ollama, Azure, Google, Groq)
- [ ] All CRUD operations functional
- [ ] Connection testing working
- [ ] Model management complete
- [ ] Tenant isolation verified
- [ ] Zero high-priority bugs
- [ ] Coverage thresholds met (70% overall, 85% business logic)

---

## Risk Mitigation

| Risk                             | Mitigation                                    |
| -------------------------------- | --------------------------------------------- |
| Credential encryption complexity | Use existing `packages/core/crypto` utilities |
| Multi-tenant isolation bugs      | Extensive tenant isolation tests              |
| UI complexity                    | Start with MVP, add advanced features later   |
| API rate limits                  | Implement caching and rate limiting           |

---

## Dependencies

**Before Phase 2:**

- Phase 1 complete (AI runtime foundation)
- Database schema approved
- tRPC infrastructure ready

**During Phase 2:**

- None (independent implementation)

**After Phase 2:**

- Phase 3: Agent Integration

---

## Next Steps

1. **Task 2.1:** Implement type system and schemas
2. **Task 2.2:** Create database schema and models
3. **Task 2.3:** Build tRPC routers
4. **Task 2.4-2.5:** Implement service layer and hooks
5. **Task 2.6-2.10:** Build UI components
6. **Task 2.11:** Integrate with agent runtime
7. **Task 2.12:** Comprehensive testing

---

**Related Documents:**

- Analysis: `/docs/plans/ai-provider/lobe-chat-analysis.md`
- Phase Plan: `/docs/plans/ai-provider/ai-provider-ui.md`
- Next Phase: `/docs/plans/ai-provider/03-phase-3-agent-integration.md`
