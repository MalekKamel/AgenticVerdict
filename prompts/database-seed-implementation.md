# Database Seed Implementation

## Context

Recent database schema changes have introduced new tables and modified existing ones. The development seed process must be updated to reflect the current schema state.

## Objective

Ensure the development seed (`make db-seed-dev`) provides complete, consistent data across all database tables, supporting:

- Full development environment setup
- Database reset and re-seed workflows
- Reliable local testing with representative data

## Task

1. Analyze the current database schema (all tables, columns, relationships, and constraints)
2. Identify gaps in existing seed data relative to the updated schema
3. Implement a comprehensive seeding script that:
   - Covers all database tables with valid, referentially consistent data
   - Respects foreign key relationships and insertion order
   - Supports idempotent execution (safe to run multiple times)
   - Includes realistic development data suitable for feature testing

## Deliverable

A single, well-structured seed file with complete implementation of the development seeding process.
