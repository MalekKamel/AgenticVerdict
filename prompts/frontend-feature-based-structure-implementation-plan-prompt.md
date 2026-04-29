Context:
The current feature implementation in `/apps/frontend` is difficult to navigate and maintain because related code is distributed across multiple top-level directories (for example, `routes`, `components`, and supporting modules), rather than grouped by feature.

Objective:
Evaluate and define a robust, feature-based folder architecture where each feature (for example, `dashboard`) owns its full implementation scope in a dedicated directory structure.

Task:
Conduct a thorough analysis of the existing frontend structure and produce a comprehensive implementation plan document that includes:

- A recommended target architecture based on industry standards and frontend best practices.
- A migration strategy from the current structure to the proposed feature-based structure.
- Clear conventions for organizing routes, components, hooks, services, tests, and feature-specific utilities.
- Risk assessment, trade-offs, and mitigation strategies.
- A phased rollout plan with validation checkpoints to minimize disruption.

Expected outcome:
A practical, detailed, and execution-ready plan that can be adopted by the engineering team to improve maintainability, discoverability, scalability, and long-term consistency in `/apps/frontend`.
