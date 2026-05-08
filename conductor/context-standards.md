# Workspace Context Engineering Standards (AgenticVerdict)

## 1. Philosophy: The "Lean Entry" Architecture

Every token in the initial context window must earn its place. The architecture follows a "Pointer & Skill" pattern:

- **Pointers:** Small, high-signal files that tell the agent _where_ to find info.
- **Skills:** Specialized, task-conditional instructions loaded only when needed.

## 2. File Roles & Ownership

### 2.1. `CLAUDE.md` (The IDE Bridge)

- **Role:** Vendor-specific entry point and IDE-native trigger matrix.
- **Constraint:** Maximum 1,000 tokens.
- **Content:** Non-negotiable guardrails and the `Skill Trigger Matrix`. NO procedural instructions.

### 2.2. `AGENTS.md` (The Onboarding SSOT)

- **Role:** High-speed "Quick Start" for new agents.
- **Constraint:** Maximum 3,000 tokens.
- **Content:** Installation commands, project high-level summary, and pointers to skills. NO domain-specific details (Frontend/Backend/CI).

### 2.3. `.agents/skills/` (The Task Layer)

- **Role:** Deep expertise and procedural workflows.
- **Constraint:** No global limit, but internally modular.
- **Content:** Detailed commands, file structures, and domain-specific conventions.

## 3. Skill Migration Rules

1. **Procedural logic** (e.g., "How to run X") belongs in a **Skill**.
2. **Architecture definitions** belong in the `architecture-governance` skill.
3. **Coding styles** (e.g., "No `any` types") belong in the `coding-standards` skill.
4. **Tool/Make commands** belong in the `runtime-config-docker` skill.

## 4. Redundancy Elimination (SSOT)

- **Trigger Matrix:** The authoritative matrix lives in `CLAUDE.md`. All other files must point to it or the `skills-reference.md`.
- **Documentation Map:** Managed via the `docs-navigation` skill.

## 5. Maintenance Protocol

When adding new features or workflows:

1. Identify the relevant skill.
2. If no skill fits, create a new one using `skill-creator`.
3. Update `CLAUDE.md` trigger matrix ONLY if a new domain-level trigger is required.
4. DO NOT append to `AGENTS.md` or `CLAUDE.md` core sections.
