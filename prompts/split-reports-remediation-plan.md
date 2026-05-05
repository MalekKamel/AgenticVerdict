# Prompt: Split Reports Feature Remediation Plan into Phase-Specific Documents

## Context

The file `/docs/audit/reports-feature-remediation.md` contains a comprehensive remediation plan with three phases:

- Phase 1: Critical Blockers (Days 1-2)
- Phase 2: High Priority Features (Days 3-4)
- Phase 3: Polish & Testing (Days 5-7)

## Task

Split the existing remediation plan into **two separate, self-contained documents**:

1. `/docs/audit/reports-remediation-phase-1.md` — Critical Blockers (Days 1-2)
2. `/docs/audit/reports-remediation-phase-2.md` — High Priority Features + Polish (Days 3-7)

## Storage Configuration

**Replace AWS S3 references with SeaweedFS** ([https://github.com/seaweedfs/seaweedfs](https://github.com/seaweedfs/seaweedfs)) as the S3-compatible storage provider, following industry standards and best practices:

### Requirements

1. **Update all storage adapter code** to use SeaweedFS S3-compatible API
2. **Modify environment configuration** to reflect SeaweedFS deployment (local + production)
3. **Update documentation** to include SeaweedFS setup and deployment guidance
4. **Ensure tenant isolation** in storage paths remains intact
5. **Maintain S3 SDK compatibility** (SeaweedFS implements S3 protocol)

### Implementation Notes

- SeaweedFS provides S3-compatible API — minimal code changes required
- Primary difference: endpoint configuration and deployment strategy
- Update `.env.docker.example` with SeaweedFS-specific variables
- Add SeaweedFS deployment notes to Docker/setup documentation

## Deliverables

1. Two new markdown files (Phase 1, Phase 2) with complete task breakdowns
2. All code examples updated to reference SeaweedFS configuration
3. Environment variables and setup instructions aligned with SeaweedFS
4. Acceptance criteria preserved and enhanced where needed
5. Testing strategy updated to include SeaweedFS integration validation

## Quality Standards

- Maintain original task structure and acceptance criteria format
- Ensure each phase document is independently actionable
- Preserve all code examples with SeaweedFS-specific updates
- Include SeaweedFS deployment reference in setup documentation
- Follow repository conventions for audit documentation

## Success Criteria

- [ ] Phase 1 document contains all Day 1-2 critical blocker tasks
- [ ] Phase 2 document contains all Day 3-7 high priority + polish tasks
- [ ] All AWS S3 references replaced with SeaweedFS equivalents
- [ ] Storage adapter code compatible with SeaweedFS S3 API
- [ ] Environment configuration examples use SeaweedFS endpoints
- [ ] Documentation includes SeaweedFS setup/deployment guidance
- [ ] Multi-tenant isolation preserved in storage implementation
