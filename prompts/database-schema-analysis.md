# Database Schema Consolidation Analysis

## Objective

Perform a comprehensive analysis of the database schema to identify opportunities for table consolidation and improved data encapsulation. The goal is to reduce unnecessary fragmentation while maintaining proper normalization and domain boundaries.

## Scope

1. **Schema Review**: Analyze all existing tables, their relationships, and data distribution patterns
2. **Consolidation Opportunities**: Identify tables that could be merged without violating normalization principles
3. **Domain Validation**: Verify that table groupings align with domain boundaries (e.g., validate whether `aiProviderTemplates` should be consolidated with `aiProviders` or remain separate)
4. **Fragmentation Assessment**: Detect over-normalized patterns that scatter related data across multiple tables

## Deliverables

- Analysis report documenting current schema fragmentation issues
- Recommended table consolidations with justification
- Migration considerations for proposed changes
- Updated ERD reflecting consolidated schema

## Constraints

- Maintain referential integrity and existing RLS policies
- Preserve multi-tenant isolation boundaries
- Do not assume current table separations are intentional—validate each against domain requirements
