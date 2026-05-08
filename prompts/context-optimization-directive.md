# Directive: Context Engineering Optimization & Agent Standards Alignment

## 1. Background & Problem Statement

The current workspace context architecture is experiencing significant overhead, with initial request sizes exceeding 25,000 tokens. This indicates sub-optimal organization of project instructions within `CLAUDE.md` and `AGENTS.md`. The resulting context "noise" reduces reasoning precision and leads to inefficient resource consumption.

## 2. Objective

Optimize the workspace instruction layer by applying industry-standard context engineering patterns. The goal is to minimize static overhead through modularization and establish a vendor-agnostic standard for agent behavior.

## 3. Scope of Task

### Phase A: Analysis & Benchmarking

- Conduct a thorough audit of `CLAUDE.md` and `AGENTS.md` to identify static content that should be dynamic.
- Evaluate current context utilization against industry best practices (e.g., Just-In-Time instruction loading, skill-based decomposition, and token-efficient formatting).
- Document findings in a structured Analysis Report.

### Phase B: Standard Definition

- Define the "AgenticVerdict Context Standard," prioritizing `AGENTS.md` as the primary source of truth.
- Establish guidelines for converting static instructions into "Skills" that are loaded only when contextually relevant.
- Design a vendor-agnostic pointer strategy for `CLAUDE.md` and other IDE-specific configurations.

### Phase C: Remediation Planning

- Develop a comprehensive implementation plan to refactor the instruction layer.
- Identify specific blocks of instruction to be migrated to the `/skills` or `.agents/skills` directories.
- Define success metrics for context reduction (e.g., target reduction in baseline token count).

## 4. Deliverables

1. **Context Analysis Report**: Comparative study of current state vs. industry standards.
2. **Workspace Engineering Standards**: Formalized best practices for context management and skill creation.
3. **Remediation Roadmap**: Step-by-step instructions for executing the optimization.

## 5. Execution Guidelines

- Ensure `AGENTS.md` remains the core architectural reference.
- Refactor `CLAUDE.md` to act as a lightweight, vendor-agnostic bridge.
- Prioritize non-breaking changes that preserve agent autonomy while reducing token overhead.
