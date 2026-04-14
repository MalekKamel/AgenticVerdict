# SpecKit Commands Guide

Use the SpecKit commands as described below for creating the specs. SpecKit creates the specs based on its own organization guide. Use the following commands sequentially.

## `/speckit-specify`

Use the `/speckit-specify` command to describe what you want to build. Focus on the **what** and **why**, not the tech stack.

**Command:**

```bash
claude --dangerously-skip-permissions -p "/speckit-specify [SPEC_PATH] [PROMPT_TEXT]"
```

**Example:**

```bash
claude --dangerously-skip-permissions -p "/speckit-specify specs/01-ui Build an application that can help me organize my photos in separate photo albums. Albums are grouped by date and can be re-organized by dragging and dropping on the main page. Albums are never in other nested albums. Within each album, photos are previewed in a tile-like interface."
```

## `/speckit-plan`

Use the `/speckit-plan` command to provide your tech stack and architecture choices.

**Command:**

```bash
claude --dangerously-skip-permissions -p "/speckit-plan [SPEC_PATH] [PROMPT_TEXT]"
```

**Example:**

```bash
claude --dangerously-skip-permissions -p "/speckit-plan specs/01-ui The application uses Vite with minimal number of libraries. Use vanilla HTML, CSS, and JavaScript as much as possible. Images are not uploaded anywhere and metadata is stored in a local SQLite database."
```

## `/speckit-tasks`

Use `/speckit-tasks` to create an actionable task list from your implementation plan.

**Command:**

```bash
claude --dangerously-skip-permissions -p "/speckit-tasks [SPEC_PATH] [PROMPT_TEXT]"
```

## `/speckit-implement`

Use `/speckit-implement` to execute all tasks and build your feature according to the plan.

**Command:**

```bash
claude --dangerously-skip-permissions -p "/speckit-implement [SPEC_PATH] [PROMPT_TEXT]"
```

---

**Note:** Commands must be used in sequence: `specify` → `plan` → `tasks` → `implement`.

**Parameters:**

- `[SPEC_PATH]` — Path where the spec will be created (e.g., `specs/01-ui`)
- `[PROMPT_TEXT]` — Your description or instructions
