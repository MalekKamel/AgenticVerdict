## Prompt Rewriter Skill Creation

### Context

A reusable prompt template is currently copied and manually edited for each prompt refinement task, with `CONTENT_HERE` replaced inline. This repetitive pattern is inefficient and inconsistent.

### Objective

Create a reusable agent skill to replace the manual prompt template, providing a standardized, professional workflow for rewriting prompts.

### Task

1. Review the existing prompt template pattern and identify its core intent.
2. Author a professional skill definition (`SKILL.md`) following industry standards and the `skill-creator` skill guidelines.
3. Apply progressive disclosure: keep the skill body under 500 lines, using bundled resources if additional depth is needed.
4. Define clear trigger conditions in the YAML frontmatter to ensure reliable skill activation.
5. Include a structured output template, rewriting principles, and before/after examples.

### Constraints

- Use the `skill-creator` skill for authoring guidance and iterative improvement.
- Follow the project's skill structure at `.agents/skills/<skill-name>/SKILL.md`.
- The `find-skills` skill is available for reference (see `/skills-lock.json`).
- Do not modify existing skills; create a new skill directory.

### Deliverables

- `.agents/skills/prompt-rewriter/SKILL.md` — Complete skill definition with frontmatter, principles, output structure, examples, and workflow.
- Refined prompt written to `/prompts/prompt-rewriter-skill-creation.md` — This file.
