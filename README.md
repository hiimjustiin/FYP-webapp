# Interdisciplinary Learning Analytics Webapp

> This project is a modern web application for interdisciplinary learning analytics, built with Vite, React, TypeScript, TailwindCSS v4, shadcn/ui, and pnpm.

## Tech Stack

- [Vite](https://vitejs.dev/) (build tool)
- [React](https://react.dev/) (UI library)
- [TypeScript](https://www.typescriptlang.org/) (type safety)
- [TailwindCSS v4](https://tailwindcss.com/) (utility-first CSS)
- [shadcn/ui](https://ui.shadcn.com/) (UI components, Radix UI, class-variance-authority, tailwind-merge, lucide-react)
- [pnpm](https://pnpm.io/) (fast package manager)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/)

### Installation

```sh
pnpm install
```

### Development

```sh
pnpm dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```sh
pnpm build
```

### Lint

```sh
pnpm lint
```

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
