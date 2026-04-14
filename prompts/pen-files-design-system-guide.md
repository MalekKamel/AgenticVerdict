# Prompt: Comprehensive Guide for `.pen` File Design System Integration

## Context

The AgenticVerdict platform utilizes Pencil.dev's `.pen` file format as the single source of truth for all UI/UX design work. These encrypted design files serve as the bridge between design concepts and implementation, ensuring consistency across the entire application through a unified design system.

**Key Considerations:**

- `.pen` files are the authoritative format for all design artifacts
- Pencil.dev MCP server tools provide the exclusive interface for reading and modifying `.pen` files
- Standard file reading tools (Read, Grep) cannot access `.pen` file contents due to encryption
- All design work must leverage Pencil MCP tools for proper file manipulation

## Objective

Create a comprehensive technical guide that establishes best practices, workflows, and standards for using `.pen` files throughout the AgenticVerdict project. This guide will serve as the reference document for designers and developers working with the design system.

## Task

Write a detailed guide that addresses the following areas:

### 1. Design System Architecture

- Define the component structure and hierarchy within `.pen` files
- Document reusable components and their usage patterns
- Establish naming conventions for design tokens, components, and variants
- Specify theming support (tenant-specific configurations, RTL/LTR layouts)

### 2. Pencil MCP Tool Usage

Provide clear documentation for:

- **Tool Selection Guide**: When to use each Pencil MCP tool
  - `get_editor_state()`: Initial setup and context discovery
  - `open_document()`: Creating or opening `.pen` files
  - `get_guidelines()`: Accessing design guides and style archetypes
  - `batch_get()`: Reading and searching design nodes
  - `batch_design()`: Executing design operations (insert, copy, update, replace, move, delete)
  - `get_screenshot()`: Visual verification of design elements
  - `export_nodes()`: Exporting designs to PNG/JPEG/WEBP/PDF formats

- **Operation Syntax**: Comprehensive examples of `batch_design` operations
- **Best Practices**: Performance optimization (max 25 operations per batch)
- **Error Handling**: Common issues and resolution strategies

### 3. Workflow Documentation

Establish clear workflows for:

- Creating new design files from scratch
- Modifying existing designs while maintaining consistency
- Working with component instances and overrides
- Design review and validation processes
- Exporting designs for development handoff

### 4. Integration with Development

Document the bridge between `.pen` files and code implementation:

- Mapping design tokens to CSS variables/Tailwind config
- Component structure alignment with React components
- Responsive design patterns in `.pen` format
- Accessibility considerations in the design system

### 5. Multi-Domain Considerations

Address the specific needs of AgenticVerdict's multi-business-domain architecture:

- Domain-specific design patterns (Marketing, Finance, Operations, SEO, Social, Local)
- Tenant-specific theming through configuration injection
- RTL/LTR layout considerations for internationalization
- Responsive patterns for web and mobile clients

### 6. Maintenance and Governance

Establish processes for:

- Version control strategies for `.pen` files
- Component lifecycle management (creation, deprecation, migration)
- Design system documentation and updates
- Onboarding new designers/developers to the `.pen` workflow

## Output Requirements

1. **Format**: Markdown document with clear sections, code examples, and visual diagrams where applicable
2. **Audience**: Designers, frontend developers, and full-stack engineers
3. **Tone**: Technical, precise, and actionable
4. **Structure**: Hierarchical with table of contents, cross-references, and index
5. **Examples**: Real-world examples from AgenticVerdict's design system
6. **Location**: Save to `/docs/architecture/business/design-system/pen-files-guide.md`

## Success Criteria

- Comprehensive coverage of all Pencil MCP tools and their use cases
- Clear, replicable workflows for common design tasks
- Concrete examples that demonstrate proper `.pen` file usage
- Alignment with AgenticVerdict's multi-tenant, multi-domain architecture
- Actionable guidance for both designers and developers
