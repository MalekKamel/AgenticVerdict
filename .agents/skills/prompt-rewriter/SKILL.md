---
name: prompt-rewriter
description: Rewrite user-provided prompts to be focused, professional, and well-structured. Use whenever a user asks to rewrite, refine, improve, or professionalize a prompt, or when they mention making a prompt clearer, more structured, or more professional. This skill should trigger for any prompt refinement task, including rewriting instructions, improving clarity, restructuring messy prompts, or converting casual requests into professional specifications.
---

# Prompt Rewriter

This skill transforms draft, informal, or unclear prompts into focused, professional, and well-structured instructions that produce higher-quality AI responses.

## Why This Matters

Well-structured prompts reduce ambiguity, set clear expectations, and guide the AI toward the desired output format. A professional prompt includes explicit context, objectives, constraints, and deliverables — eliminating the guesswork that leads to inconsistent or off-target responses.

## When to Use This Skill

**Trigger conditions:**

- User asks to "rewrite this prompt", "make this prompt better", "refine this prompt"
- User wants a prompt to be "more professional", "clearer", "more structured"
- User provides a draft prompt that is verbose, ambiguous, or poorly organized
- User mentions they want to reuse a prompt and needs it polished

## Rewriting Principles

1. **Preserve intent** — The core request must remain unchanged; only the expression improves.
2. **Lead with context** — Establish background information before stating the task.
3. **Separate concerns** — Use distinct sections for context, objective, task, constraints, and deliverables.
4. **Be explicit about output** — Specify the expected format, structure, and any file paths for deliverables.
5. **Remove redundancy** — Eliminate repeated instructions and filler language.
6. **Use imperative voice** — Frame instructions as direct actions ("Create...", "Define...", "Ensure...").

## Output Structure

Use this structure for every rewritten prompt:

```markdown
## [Concise Title]

### Context

[Background information, current state, or problem statement — 1-3 sentences]

### Objective

[What the prompt aims to achieve — 1 sentence]

### Task

[Specific actions to take, numbered or bulleted if multi-step]

### Constraints

[Any boundaries, rules, or requirements that must be followed]

### Deliverables

[Expected outputs with file paths or formats if applicable]
```

Not every section is required for every prompt — use judgment to include only what adds signal. Simple prompts may need only Context, Task, and Deliverables.

## Examples

**Before:**

```
hey can you rewrite this to be better and more professional like make it sound good and structured? also put it in a file at /prompts/something.md thanks
```

**After:**

```markdown
## Prompt Refinement Request

### Context

The current prompt lacks structure and professional tone, making it difficult to produce consistent, high-quality AI responses.

### Objective

Rewrite the provided prompt to be focused, professional, and well-structured while preserving the original intent.

### Task

1. Analyze the original prompt to identify core intent and requirements.
2. Restructure using clear sections (Context, Objective, Task, Deliverables).
3. Remove redundant or ambiguous language.
4. Apply professional, imperative tone throughout.

### Deliverables

- Refined prompt written to `/prompts/<descriptive-filename>.md`
```

## Workflow

1. **Read the original prompt** — Identify the core intent, key requirements, and any implicit constraints.
2. **Identify structural gaps** — Note missing context, unclear objectives, or undefined deliverables.
3. **Apply the output structure** — Draft the rewritten prompt using the template above.
4. **Review for fidelity** — Verify the rewritten prompt preserves all original requirements without adding unsupported assumptions.
5. **Write to file** — Save the refined prompt to the specified path in the `/prompts/` directory, using a descriptive, kebab-case filename.

## Common Improvements

| Issue                           | Fix                                |
| ------------------------------- | ---------------------------------- |
| Run-on instructions             | Break into numbered steps          |
| Vague output expectations       | Specify format, path, or structure |
| Mixed concerns in one paragraph | Separate into distinct sections    |
| Casual or uncertain tone        | Use direct, imperative language    |
| Missing background              | Add a concise Context section      |
| No success criteria             | Define clear Deliverables          |
