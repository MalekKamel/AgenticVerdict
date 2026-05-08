## Debugging Skill Creation

### Context

The AgenticVerdict monorepo requires a dedicated debugging skill to enable agents to systematically diagnose and resolve issues across the full Docker-based development stack. The skill should enforce a structured, step-by-step debugging workflow that prioritizes service-level diagnostics before application-level investigation.

### Objective

Research industry standards and best practices for agent skill design, audit existing project skills for patterns and conventions, then author a professional debugging skill that leverages the project's `Makefile` commands for efficient issue resolution.

### Prerequisites

- Skills infrastructure initialized via `npx skills init`
- `find-skills` skill available (see `/skills-lock.json`)
- `skill-creator` skill available for skill authoring and iterative improvement guidance

### Required Work

1. **Research Phase**
   - Review industry best practices for debugging workflow design in agent-assisted development environments.
   - Audit existing skills under `.agents/skills/` to identify structural patterns, trigger conventions, and instructional styles.
   - Study the `skill-creator` skill for authoring guidance and the `runtime-config-docker` skill as a reference for Makefile-integrated workflows.

2. **Skill Design**
   - Define a clear, structured debugging workflow with the following diagnostic order:
     1. Docker service health (`make health`, `make ps`, `make dev-logs`)
     2. Container-level diagnostics (`make infra-logs`, `make apps-logs`, service-specific log targets)
     3. Application-level console logs and error traces
     4. Database and connectivity checks (`make shell-db`, `make db-migrate`)
   - Map all relevant `Makefile` targets to their appropriate debugging context (see `Makefile` at project root).
   - Define clear trigger conditions in the skill's frontmatter description.

3. **Skill Authoring**
   - Create `SKILL.md` at `.agents/skills/debugging/SKILL.md` following the project's skill structure:
     - YAML frontmatter with `name` and `description` (include explicit trigger contexts)
     - Purpose and when-to-use sections
     - Step-by-step debugging workflow
     - Relevant Makefile commands organized by diagnostic stage
     - Common failure patterns and resolution guidance
     - Validation commands to confirm issue resolution
   - Keep the skill body under 500 lines; use bundled resources (scripts, references) if additional depth is needed.

4. **Integration**
   - Register the skill in `CLAUDE.md` trigger matrix.
   - Ensure the skill's description is specific enough to trigger reliably when debugging-related queries arise.

### Deliverables

- `.agents/skills/debugging/SKILL.md` — Complete debugging skill definition.
- Updated `CLAUDE.md` — Trigger matrix entry for the new skill.
- Brief validation summary confirming the skill follows project conventions and leverages Makefile commands correctly.

### Success Criteria

- The skill provides a clear, repeatable debugging workflow from infrastructure to application layer.
- All Makefile diagnostic commands are correctly mapped and documented.
- The skill triggers appropriately for debugging-related queries without false positives on unrelated tasks.
- The skill follows the same structural conventions as existing project skills.
