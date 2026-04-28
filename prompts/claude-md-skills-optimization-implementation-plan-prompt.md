## Context

The current `CLAUDE.md` has become overly large and is negatively impacting context efficiency. We need to reduce prompt-token overhead while preserving project guidance quality.

## Objective

Define and execute a structured skills strategy that keeps `CLAUDE.md` lean by:

- incorporating relevant reusable skills from [skills.sh](https://skills.sh/), and
- creating high-value custom project skills where reusable skills are insufficient.

## Task

Conduct a thorough analysis of the current `CLAUDE.md` and produce a **comprehensive implementation plan** for skill adoption and development.

Your plan must include:

1. **Current-State Analysis**
   - Identify sections in `CLAUDE.md` that are repetitive, operational, procedural, or better suited for skill encapsulation.
   - Classify each section as:
     - keep in `CLAUDE.md`,
     - migrate to reusable skill, or
     - migrate to custom skill.
2. **Skill Mapping Strategy**
   - Evaluate available skills from `https://skills.sh/` and map them to project needs.
   - Identify capability gaps requiring custom skills.
   - Provide explicit rationale for each selected or proposed skill.
3. **Implementation Roadmap**
   - Define phased execution (e.g., discovery, migration, validation, iteration).
   - Include deliverables, ownership assumptions, dependencies, and risk controls.
   - Propose a rollout sequence that minimizes disruption to active development.
4. **Custom Skill Specifications**
   - For each required custom skill, define:
     - purpose and scope,
     - triggering conditions,
     - required inputs/outputs,
     - success criteria,
     - maintenance/iteration guidance.
5. **Governance and Quality Controls**
   - Define standards for when guidance belongs in `CLAUDE.md` vs a skill.
   - Include review cadence, versioning approach, and token-budget guardrails.
   - Include validation checks to ensure behavior parity after migration.
6. **Success Metrics**
   - Provide measurable criteria for success (e.g., token reduction targets, usability, maintainability, reliability).

## Important Notes

- `npx skills init` has already been run.
- `find-skills` is already added per `skills-lock.json`.
- `skill-creator` is available for creating and iteratively improving new skills.

## Expected Output

Produce a single, actionable implementation plan document that can be executed directly by the team.
