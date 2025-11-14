# Interdisciplinary Learning Analytics Webapp

> A modern full-stack web application for interdisciplinary learning analytics with AI-powered project feedback.

## Tech Stack

### Frontend
- [Vite](https://vitejs.dev/) (build tool)
- [React 19](https://react.dev/) (UI library)
- [TypeScript](https://www.typescriptlang.org/) (type safety)
- [TailwindCSS v4](https://tailwindcss.com/) (utility-first CSS)
- [shadcn/ui](https://ui.shadcn.com/) (UI components, Radix UI, class-variance-authority, tailwind-merge, lucide-react)
- [pnpm](https://pnpm.io/) (fast package manager)

### Backend
- [Express.js](https://expressjs.com/) with TypeScript
- [PostgreSQL 15](https://www.postgresql.org/) (database)
- [node-pg-migrate](https://github.com/salsita/node-pg-migrate) (database migrations)
- JWT authentication

### AI Service
- [FastAPI](https://fastapi.tiangolo.com/) (Python web framework)
- [Pydantic AI](https://ai.pydantic.dev/) (AI agent framework)
- [OpenAI GPT-4o](https://openai.com/) (AI model)
- Document parsing (PDF, DOCX)

## Getting Started

### Quick Start with Docker (Recommended)

```sh
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-proj-your-key-here

# Start all services
docker compose up -d --build

# Run database migrations
docker compose exec backend pnpm db:migrate

# View logs
docker compose logs -f
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- AI Service: http://localhost:8000
- PostgreSQL: localhost:5432

### Development Setup

#### Frontend Only

```sh
pnpm install
pnpm dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

#### Full Stack Development

```sh
# Terminal 1 - Database
docker compose up postgres -d

# Terminal 2 - Backend + Database
cd backend
pnpm install
pnpm db:migrate
pnpm dev

# Terminal 3 - AI Service
cd backend-ai
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add OPENAI_API_KEY
python main.py

# Terminal 4 - Frontend
pnpm install
pnpm dev
```

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/)
- [Docker & Docker Compose](https://www.docker.com/) (for containerized deployment)
- [Python 3.11+](https://www.python.org/) (for AI service development)
- OpenAI API Key (required for AI feedback features)

## TailwindCSS v4 Notes

- Uses `@import "tailwindcss";` in `src/index.css` (no `@tailwind` directives)
- Configuration in `tailwind.config.ts`
- Animations via `tailwindcss-animate`

## shadcn/ui

shadcn/ui provides a set of accessible, customizable UI components. Components are located in `src/components/ui/` and can be extended as needed.

To add new components:

```sh
pnpm dlx shadcn@latest add <component>
```

## Project Structure

- `src/` — main source code
  - `components/ui/` — shadcn/ui components
  - `lib/utils.ts` — utility functions (e.g., `cn`)
  - `App.tsx` — main app entry
- `tailwind.config.ts` — TailwindCSS config
- `components.json` — shadcn/ui config

## ESLint

TypeScript-aware linting is enabled. See `eslint.config.js` for details. Run `pnpm lint` to check code quality.

## Scripts

- `pnpm dev` — start development server
- `pnpm build` — build for production
- `pnpm lint` — run linter

## License

MIT (or specify your license here)
