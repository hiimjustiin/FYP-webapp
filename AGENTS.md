# AGENTS.md - AI Coding Agent Guidelines

> **Important**: For detailed project context, style guides, and workflows, refer to the [`conductor/`](./conductor/) directory which contains comprehensive documentation.

## Critical Rules - DO NOT VIOLATE

1. **NEVER use `any` type** - Always use proper types, `unknown`, or create interfaces
2. **NEVER disable ESLint rules** - Fix the underlying issue instead of suppressing errors
3. **NEVER use `// @ts-ignore` or `// @ts-expect-error`** - These bypass type safety
4. **Fix root causes** - If you encounter type conflicts, fix the dependency/type issue properly (e.g., using `overrides` in package.json, creating proper type definitions, or refactoring code)

## Quick Reference

| Component | Directory | Language | Package Manager |
|-----------|-----------|----------|-----------------|
| Frontend | `/` (root) | TypeScript/React 19 | **Bun** |
| Backend API | `/backend` | TypeScript/Express | **Bun** |
| AI Service | `/backend-ai` | Python/FastAPI | pip |

## Build/Lint/Test Commands

### Frontend (React + Vite)

```bash
# Development
bun dev                     # Start Vite dev server (port 5173)
bun build                   # TypeScript compile + Vite build
bun lint                    # ESLint check
bun typecheck               # TypeScript type checking only

# Full stack development (with Docker)
bun dev:full                # Start backend, postgres, AI service + frontend
bun dev:backend             # Start only backend + postgres
bun dev:stop                # Stop all Docker services
bun dev:logs                # View backend logs
```

### Backend (Express + TypeScript)

```bash
cd backend

bun dev                     # Start with hot reload (--watch)
bun build                   # Compile TypeScript to dist/
bun typecheck               # TypeScript type checking
bun start                   # Run compiled JS (production)

# Database
bun db:migrate              # Run pending migrations
bun db:migrate:down         # Rollback last migration
bun db:seed                 # Seed database with test data
```

### AI Service (FastAPI + Python)

```bash
cd backend-ai

# Via Docker (recommended)
docker-compose up backend-ai

# Local development
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Code Style Guidelines

### TypeScript (Frontend & Backend)

Refer to: [`conductor/code_styleguides/typescript.md`](./conductor/code_styleguides/typescript.md)

**Key Rules:**
- Use `const` by default, `let` only when reassignment needed. **Never use `var`**
- Use ES6 modules (`import`/`export`). **Do not use `namespace`**
- Use **named exports only** - no default exports
- Use `private`/`protected` modifiers, not `#private` fields
- Use single quotes (`'`) for strings, template literals for interpolation
- Always use `===` and `!==` for equality checks
- **NEVER use `any`** - prefer `unknown`, create interfaces, or fix the underlying type issue
- **NEVER disable ESLint** - fix the actual problem instead
- End all statements with semicolons

**Naming Conventions:**
- `UpperCamelCase`: Classes, interfaces, types, enums
- `lowerCamelCase`: Variables, functions, methods, properties
- `CONSTANT_CASE`: Global constants, enum values
- **No `_` prefix/suffix** for any identifiers

### React Patterns

```typescript
// Component structure
const MyComponent = ({ prop1, prop2 }: Props) => {
  // hooks first
  const [state, setState] = useState<Type>(initial);
  
  // derived values
  const computed = useMemo(() => /* ... */, [deps]);
  
  // effects
  useEffect(() => { /* ... */ }, [deps]);
  
  // handlers
  const handleClick = useCallback(() => { /* ... */ }, [deps]);
  
  return (/* JSX */);
};

export { MyComponent };  // Named export only
```

### Import Order

```typescript
// 1. React/framework imports
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import { clsx } from 'clsx';

// 3. Internal components/modules (absolute paths)
import { Button } from '../../components/ui/Button/Button';
import { projectService } from '../../services/projectService';

// 4. Types (if separate)
import type { Project } from '../../services/projectService';

// 5. Styles/assets
import './Component.css';
```

### Backend API Response Format

```typescript
// Success response
res.json({
  success: true,
  data: { /* payload */ }
});

// Error response
res.status(400).json({
  success: false,
  error: { message: 'Description of error' }
});
```

### Error Handling

```typescript
// Backend controllers
try {
  // ... logic
} catch (error) {
  console.error('Operation failed:', error);
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error' }
  });
}

// Frontend services
try {
  const data = await api.get<ResponseType>('/endpoint');
  return data;
} catch (err) {
  console.error('Failed to fetch:', err);
  throw err;  // Let component handle UI error state
}
```

## Project Structure

```
ila-webapp/
├── conductor/              # Project documentation hub
│   ├── code_styleguides/   # Language-specific style guides
│   ├── tracks/             # Feature tracks and plans
│   ├── index.md            # Documentation index
│   ├── product.md          # Product definition
│   ├── product-guidelines.md
│   ├── tech-stack.md       # Technology choices
│   └── workflow.md         # Development workflow
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route pages
│   ├── services/           # API service modules
│   └── lib/                # Utilities and helpers
├── backend/                # Express.js API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # Route definitions
│   │   ├── middleware/     # Express middleware
│   │   └── models/         # Database models
│   └── migrations/         # Database migrations
└── backend-ai/             # FastAPI AI service
    ├── agents/             # AI agent implementations
    ├── services/           # Business logic
    └── models/             # Pydantic models
```

## Database

- **PostgreSQL 15** via Docker
- Migrations: `node-pg-migrate` in `backend/migrations/`
- Create migration: `bun db:migrate:create <name>`

## Key Conventions

1. **Always use Bun** instead of npm/pnpm for JS/TS projects
2. **Named exports only** - no default exports
3. **Strict TypeScript** - no `any`, no eslint-disable, enable all strict checks
4. **API responses** follow `{ success: boolean, data?: T, error?: { message: string } }`
5. **Test coverage** target: >80%
6. **Commit messages**: `<type>(<scope>): <description>` (see conductor/workflow.md)
7. **Fix root causes** - Don't suppress type errors, fix the underlying issue

## Handling Type Conflicts

When encountering type conflicts (e.g., conflicting dependency versions):

1. **First**: Check if it's a dependency version mismatch
2. **Add overrides** in package.json to force consistent versions:
   ```json
   "overrides": {
     "@types/problematic-package": "^x.y.z"
   }
   ```
3. **Create proper interfaces** instead of using `any`
4. **Create wrapper functions** with proper return types if needed
5. **Reinstall dependencies** after adding overrides: `rm -rf node_modules && bun install`

## Common Issues

### Type Conflicts in Dependencies
If you see errors about incompatible types from different package versions:
1. Check which packages have conflicting versions
2. Add explicit version in `devDependencies` and `overrides` section
3. Run `rm -rf node_modules && bun install`
4. Create typed wrapper functions if needed (see `backend/src/middleware/upload.ts` for example)

### Docker Services
If services fail to start:
```bash
docker-compose down -v  # Clean slate
docker-compose up -d postgres  # Start DB first
docker-compose up -d backend backend-ai  # Then services
```

## Further Reading

- [Product Definition](./conductor/product.md)
- [Product Guidelines](./conductor/product-guidelines.md)
- [Tech Stack](./conductor/tech-stack.md)
- [Development Workflow](./conductor/workflow.md)
- [TypeScript Style Guide](./conductor/code_styleguides/typescript.md)
- [JavaScript Style Guide](./conductor/code_styleguides/javascript.md)
