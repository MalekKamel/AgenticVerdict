# Language Server Protocol (LSP) Integration Plan

## Project: AgenticVerdict

**Date:** 2026-05-09  
**Scope:** OpenCode LSP configuration for the AgenticVerdict monorepo

---

## 1. Codebase Language Analysis

### 1.1 Primary Languages

| Language    | File Extensions       | Usage Scope                                   | Priority |
| ----------- | --------------------- | --------------------------------------------- | -------- |
| TypeScript  | `.ts`                 | All source code across 4 apps + 13 packages   | Critical |
| TSX (React) | `.tsx`                | Frontend app, UI package                      | Critical |
| JavaScript  | `.js`, `.mjs`, `.cjs` | Config files (Vite, ESLint, Playwright, etc.) | High     |

### 1.2 Secondary Languages

| Language   | File Extensions              | Usage Scope                                                               | Priority |
| ---------- | ---------------------------- | ------------------------------------------------------------------------- | -------- |
| SQL        | `.sql`                       | Database migrations, RLS policies, views (`packages/database/`)           | High     |
| CSS        | `.css`                       | UI package styles, Tailwind utilities                                     | Medium   |
| YAML       | `.yml`, `.yaml`              | Docker Compose (7+ files), GitHub Actions (7 workflows), configs, locales | Medium   |
| JSON       | `.json`                      | Package manifests, tsconfigs, locales (5 languages), Grafana dashboards   | Medium   |
| Markdown   | `.md`                        | Documentation, specs, plans, changelogs                                   | Low      |
| Dockerfile | `Dockerfile`, `Dockerfile.*` | Multi-stage builds for api, frontend, worker                              | Medium   |
| Makefile   | `Makefile`                   | 50+ Docker/compose orchestration targets                                  | Medium   |
| Shell      | `.sh`                        | Test scripts, Husky hooks                                                 | Low      |
| Python     | `.py`                        | Design system validation (`design-system/validate-pen-files.py`)          | Low      |

---

## 2. Required Language Servers

### 2.1 Critical Priority

#### TypeScript Language Server (`typescript-language-server`)

- **Purpose:** Autocomplete, go-to-definition, find references, rename, diagnostics, refactoring for TypeScript/TSX/JavaScript
- **Installation:** `npm install -g typescript-language-server typescript`
- **Configuration:**
  ```json
  {
    "command": "typescript-language-server",
    "args": ["--stdio"],
    "languages": ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    "initializationOptions": {
      "preferences": {
        "includeCompletionsForModuleExports": false,
        "includeCompletionsWithInsertText": true,
        "includeAutomaticOptionalChainCompletions": true
      }
    }
  }
  ```
- **Project-specific notes:**
  - Uses TypeScript 5.7.2 — ensure the LSP uses the workspace version, not the global one
  - Monorepo with path aliases (`@/*` in frontend, `@agenticverdict/*` for packages)
  - Root `tsconfig.json` extends to per-package configs — LSP should resolve from workspace root
  - Vite-based bundling with `Bundler` moduleResolution

### 2.2 High Priority

#### SQL Language Server (`sql-language-server` or `vscode-sqlite`)

- **Purpose:** Syntax highlighting, linting, and autocomplete for PostgreSQL SQL files
- **Installation:** `npm install -g sql-language-server`
- **Configuration:**
  ```json
  {
    "command": "sql-language-server",
    "args": ["up", "--method", "stdio"],
    "languages": ["sql"],
    "settings": {
      "sql": {
        "dialect": "PostgreSQL",
        "lint": {
          "rules": ["strong"]
        }
      }
    }
  }
  ```
- **Project-specific notes:**
  - Files located in `packages/database/migrations/` and `packages/database/src/schema/`
  - PostgreSQL dialect with RLS policies, JSONB columns, and custom types
  - Drizzle ORM generates SQL — LSP helps with raw migration files

#### ESLint Language Server (`vscode-eslint` via LSP)

- **Purpose:** Real-time linting diagnostics matching the project's ESLint v9 flat config
- **Installation:** `npm install -g eslint-language-server` (or use ESLint directly via LSP)
- **Configuration:**
  ```json
  {
    "command": "vscode-eslint-language-server",
    "args": ["--stdio"],
    "languages": ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    "settings": {
      "eslint": {
        "options": {
          "overrideConfigFile": "eslint.config.mjs"
        }
      }
    }
  }
  ```
- **Project-specific notes:**
  - Uses ESLint v9 flat config (`eslint.config.mjs`)
  - Per-app overrides exist (`apps/frontend/eslint.config.mjs`)
  - lint-staged runs `eslint --fix` on commit

### 2.3 Medium Priority

#### YAML Language Server (`yaml-language-server`)

- **Purpose:** Schema validation, autocomplete, and formatting for YAML files
- **Installation:** `npm install -g yaml-language-server`
- **Configuration:**
  ```json
  {
    "command": "yaml-language-server",
    "args": ["--stdio"],
    "languages": ["yaml"],
    "settings": {
      "yaml": {
        "schemas": {
          "https://json.schemastore.org/docker-compose.json": "docker-compose*.yml",
          "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml",
          "https://json.schemastore.org/package.json": "**/package.json"
        },
        "validate": true,
        "format": { "enable": true }
      }
    }
  }
  ```
- **Project-specific notes:**
  - 7+ Docker Compose files with complex service definitions
  - 7 GitHub Actions workflows
  - Observability configs (Prometheus, Grafana, Loki, Promtail, Falco)

#### CSS Language Server (`css-languageserver`)

- **Purpose:** Autocomplete, validation, and go-to-definition for CSS files
- **Installation:** Bundled with `vscode-css-languageserver-bin`
- **Configuration:**
  ```json
  {
    "command": "css-languageserver",
    "args": ["--stdio"],
    "languages": ["css", "scss", "less"],
    "settings": {
      "css": {
        "validate": true,
        "lint": { "unknownAtRules": "ignore" }
      }
    }
  }
  ```
- **Project-specific notes:**
  - Used in `packages/ui/src/styles/`
  - Tailwind CSS v3.4 with disabled preflight (Mantine handles reset)
  - PostCSS with Mantine preset

#### Tailwind CSS Language Server (`@tailwindcss/language-server`)

- **Purpose:** Autocomplete for Tailwind utility classes, CSS IntelliSense
- **Installation:** `npm install -g @tailwindcss/language-server`
- **Configuration:**
  ```json
  {
    "command": "tailwindcss-language-server",
    "args": ["--stdio"],
    "languages": ["typescript", "typescriptreact", "javascript", "html", "css"],
    "settings": {
      "tailwindCSS": {
        "experimental": {
          "classRegex": [
            ["className", "\"([^\"]*)\""],
            ["class", "\"([^\"]*)\""]
          ]
        },
        "includeLanguages": {
          "typescript": "javascript",
          "typescriptreact": "javascript"
        }
      }
    }
  }
  ```
- **Project-specific notes:**
  - Config at `apps/frontend/tailwind.config.cjs`
  - Content paths include `src/**/*.{js,ts,jsx,tsx}` and `packages/ui/src/**/*`
  - Preflight disabled — Mantine provides reset

#### Dockerfile Language Server (`dockerfile-language-server`)

- **Purpose:** Syntax validation, autocomplete, and linting for Dockerfiles
- **Installation:** `npm install -g dockerfile-language-server-nodejs`
- **Configuration:**
  ```json
  {
    "command": "docker-lang-server",
    "args": ["--stdio"],
    "languages": ["dockerfile"]
  }
  ```
- **Project-specific notes:**
  - Multi-stage builds across `apps/api/Dockerfile`, `apps/frontend/Dockerfile`, `apps/worker/Dockerfile`
  - Base images defined in `docker-compose.base-images.yml`

#### JSON Language Server (`json-language-server`)

- **Purpose:** Schema validation, autocomplete, and formatting for JSON files
- **Installation:** `npm install -g vscode-json-languageserver`
- **Configuration:**
  ```json
  {
    "command": "json-languageserver",
    "args": ["--stdio", "--log-level", "error"],
    "languages": ["json"],
    "settings": {
      "json": {
        "validate": { "enable": true },
        "format": { "enable": true },
        "schemas": [
          {
            "fileMatch": ["**/package.json"],
            "url": "https://json.schemastore.org/package.json"
          },
          {
            "fileMatch": ["**/tsconfig*.json"],
            "url": "https://json.schemastore.org/tsconfig.json"
          }
        ]
      }
    }
  }
  ```

#### Markdown Language Server (`markdown-language-server`)

- **Purpose:** Link validation, diagnostics, and workspace symbol support for Markdown
- **Installation:** `npm install -g markdown-language-server`
- **Configuration:**
  ```json
  {
    "command": "markdown-languageserver",
    "args": ["--stdio"],
    "languages": ["markdown"],
    "settings": {
      "markdown": {
        "validate": { "fragmentLinks": true, "fileLinks": true, "fileLinksNotInWorkspace": false }
      }
    }
  }
  ```
- **Project-specific notes:**
  - Extensive documentation in `docs/`, `openspec/`, `.agents/`, `.claude/`
  - Spec files, plans, architecture docs, changelogs

### 2.4 Low Priority

#### Makefile Language Server (`makefile-language-server`)

- **Purpose:** Syntax highlighting, target autocomplete, and variable resolution
- **Installation:** `npm install -g makefile-language-server`
- **Configuration:**
  ```json
  {
    "command": "makefile-language-server",
    "args": ["--stdio"],
    "languages": ["makefile"]
  }
  ```
- **Project-specific notes:**
  - Root `Makefile` with 50+ targets
  - Primary entry point for Docker orchestration (`make dev`, `make health`, etc.)

#### Bash Language Server (`bash-language-server`)

- **Purpose:** Syntax checking, autocomplete, and go-to-definition for shell scripts
- **Installation:** `npm install -g bash-language-server`
- **Configuration:**
  ```json
  {
    "command": "bash-language-server",
    "args": ["start"],
    "languages": ["shellscript"]
  }
  ```
- **Project-specific notes:**
  - Husky hooks (`.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`)
  - Test scripts (`tests/scripts/*.sh`)

#### Pyright (Python Language Server)

- **Purpose:** Type checking and autocomplete for Python files
- **Installation:** `npm install -g pyright`
- **Configuration:**
  ```json
  {
    "command": "pyright-langserver",
    "args": ["--stdio"],
    "languages": ["python"]
  }
  ```
- **Project-specific notes:**
  - Single file: `design-system/validate-pen-files.py`
  - Low priority given minimal Python usage

---

## 3. OpenCode Integration

### 3.1 Configuration File Structure

Create or update the OpenCode LSP configuration at `.opencode/config.json` (or equivalent OpenCode LSP config location):

```json
{
  "lsp": {
    "servers": {
      "typescript": {
        "command": "typescript-language-server",
        "args": ["--stdio"],
        "fileMatch": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
        "workspaceRoot": ".",
        "settings": {
          "typescript": {
            "tsdk": "./node_modules/typescript/lib",
            "preferences": {
              "includeCompletionsForModuleExports": false,
              "includeCompletionsWithInsertText": true
            }
          }
        }
      },
      "sql": {
        "command": "sql-language-server",
        "args": ["up", "--method", "stdio"],
        "fileMatch": ["**/*.sql"],
        "settings": {
          "sql": { "dialect": "PostgreSQL" }
        }
      },
      "yaml": {
        "command": "yaml-language-server",
        "args": ["--stdio"],
        "fileMatch": ["**/*.yml", "**/*.yaml"],
        "settings": {
          "yaml": {
            "schemas": {
              "https://json.schemastore.org/docker-compose.json": "docker-compose*.yml",
              "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml"
            }
          }
        }
      },
      "css": {
        "command": "css-languageserver",
        "args": ["--stdio"],
        "fileMatch": ["**/*.css"]
      },
      "tailwindcss": {
        "command": "tailwindcss-language-server",
        "args": ["--stdio"],
        "fileMatch": ["**/*.ts", "**/*.tsx", "**/*.css"],
        "settings": {
          "tailwindCSS": {
            "includeLanguages": { "typescript": "javascript", "typescriptreact": "javascript" }
          }
        }
      },
      "dockerfile": {
        "command": "docker-lang-server",
        "args": ["--stdio"],
        "fileMatch": ["**/Dockerfile*"]
      },
      "json": {
        "command": "json-languageserver",
        "args": ["--stdio", "--log-level", "error"],
        "fileMatch": ["**/*.json"]
      },
      "markdown": {
        "command": "markdown-languageserver",
        "args": ["--stdio"],
        "fileMatch": ["**/*.md"]
      },
      "makefile": {
        "command": "makefile-language-server",
        "args": ["--stdio"],
        "fileMatch": ["**/Makefile*", "**/*.mk"]
      },
      "bash": {
        "command": "bash-language-server",
        "args": ["start"],
        "fileMatch": ["**/*.sh", "**/*.bash"]
      }
    }
  }
}
```

### 3.2 Workspace Configuration

For monorepo-aware TypeScript support, configure the LSP to recognize the workspace structure:

```json
{
  "lsp": {
    "workspaceFolders": [{ "path": ".", "name": "agenticverdict" }],
    "typescript": {
      "preferWorkspaceTsdk": true,
      "disableAutomaticTypeAcquisition": false
    }
  }
}
```

---

## 4. Implementation Priority Order

| Phase       | Priority | Language Servers                          | Estimated Effort |
| ----------- | -------- | ----------------------------------------- | ---------------- |
| **Phase 1** | Critical | TypeScript/TSX/JS                         | 1-2 hours        |
| **Phase 2** | High     | SQL (PostgreSQL), ESLint                  | 1 hour           |
| **Phase 3** | Medium   | YAML, CSS, Tailwind CSS, Dockerfile, JSON | 2-3 hours        |
| **Phase 4** | Low      | Markdown, Makefile, Bash, Python          | 1-2 hours        |

---

## 5. Installation Commands

### 5.1 Global Installation (Recommended for LSPs)

```bash
# Phase 1 - Critical
npm install -g typescript-language-server

# Phase 2 - High
npm install -g sql-language-server

# Phase 3 - Medium
npm install -g yaml-language-server
npm install -g vscode-css-languageserver-bin
npm install -g @tailwindcss/language-server
npm install -g dockerfile-language-server-nodejs
npm install -g vscode-json-languageserver

# Phase 4 - Low
npm install -g markdown-language-server
npm install -g makefile-language-server
npm install -g bash-language-server
npm install -g pyright
```

### 5.2 Verification

```bash
# Verify each server is installed and accessible
typescript-language-server --version
sql-language-server --version
yaml-language-server --version
css-languageserver --version
tailwindcss-language-server --version
docker-lang-server --version
json-languageserver --version
markdown-languageserver --version
makefile-language-server --version
bash-language-server --version
pyright --version
```

---

## 6. Project-Specific Considerations

### 6.1 TypeScript Monorepo Resolution

- The LSP must resolve `@agenticverdict/*` workspace packages from `packages/`
- Path alias `@/*` maps to `apps/frontend/src/` — ensure frontend tsconfig is respected
- Vite's `Bundler` moduleResolution differs from Node — LSP should use workspace tsconfig
- `tsc --noEmit` is the typecheck command — LSP diagnostics should align

### 6.2 SQL/Drizzle ORM

- Drizzle ORM generates TypeScript from schema — raw `.sql` files are only in migrations
- LSP should focus on `packages/database/migrations/*.sql` for PostgreSQL syntax
- RLS policies use PostgreSQL-specific syntax (`ALTER DEFAULT PRIVILEGES`, `GRANT`, etc.)

### 6.3 Tailwind + Mantine

- Tailwind preflight is disabled — Mantine provides CSS reset
- Tailwind content paths span both `apps/frontend/src/` and `packages/ui/src/`
- PostCSS config uses Mantine preset — CSS LSP should ignore Mantine-specific at-rules

### 6.4 Docker Compose Complexity

- 7 compose files at root + 4 in `deploy/`
- Services span PostgreSQL 16, Redis 7, SeaweedFS, Prometheus, Grafana, Loki, Promtail, Falco
- YAML schema validation should reference Docker Compose spec

### 6.5 Performance Considerations

- Monorepo has 17+ packages and 4 apps — TypeScript LSP may need increased memory
- Consider setting `TSSERVER_MAX_MEMORY` environment variable for the TypeScript server
- Exclude `node_modules/`, `dist/`, `.turbo/`, `coverage/`, `ignored/` from LSP file watching

---

## 7. Exclusions and Ignore Patterns

Configure LSP file watchers to exclude:

```
node_modules/
dist/
.next/
.turbo/
coverage/
ignored/
backups/
sboms/
logs/
secrets/
.env*
pnpm-lock.yaml
```

---

## 8. Testing and Validation

After configuration, validate each LSP:

1. **TypeScript:** Open a `.ts` file — verify autocomplete, go-to-definition, and error highlighting
2. **SQL:** Open `packages/database/migrations/001_rls_policies.sql` — verify PostgreSQL syntax highlighting
3. **YAML:** Open `docker-compose.yml` — verify Docker Compose schema validation
4. **Tailwind:** Open a `.tsx` file with `className` — verify Tailwind class autocomplete
5. **Dockerfile:** Open `apps/api/Dockerfile` — verify Dockerfile syntax validation
6. **Makefile:** Open root `Makefile` — verify target autocomplete

---

## 9. Maintenance

- **TypeScript:** Update when `typescript` version changes in root `package.json`
- **Tailwind:** Update when `tailwind.config.cjs` changes
- **YAML schemas:** Schema URLs are external — no maintenance needed unless custom schemas are added
- **New languages:** Add LSP entries to `.opencode/config.json` following the established pattern
