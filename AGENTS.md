# AGENTS.md — parallel-translator

## Project Overview

A **Vue 3** single-page application built with **Vite** and written in **TypeScript**. The project is a parallel translator UI.

## Tech Stack

| Layer           | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Framework       | Vue 3 (Composition API + `<script setup>`)            |
| Build tool      | Vite 8                                                |
| Language        | TypeScript (strict mode)                              |
| Styling         | Tailwind CSS v4 (`@tailwindcss/vite` plugin)          |
| Typography      | `@tailwindcss/typography` (Lora & Merriweather fonts) |
| UI components   | shadcn-vue (style: `new-york`, base color: `neutral`) |
| Icons           | lucide-vue-next                                       |
| Search Engine   | fuse.js (fuzzy client-side searching)                 |
| Utility Hooks   | `@vueuse/core` (dark mode toggle)                     |
| Package manager | Bun                                                   |

## Project Structure

```
parallel-translator/
├── src/
│   ├── components/        # App-level components
│   │   └── ui/            # shadcn-vue auto-generated components (do NOT edit manually)
│   ├── composables/       # Vue composables
│   ├── lib/
│   │   └── utils.ts       # cn() helper (clsx + tailwind-merge)
│   ├── assets/            # Static assets
│   ├── App.vue            # Root component
│   ├── main.ts            # Entry point
│   └── style.css          # Global styles + Tailwind import + CSS variables
├── components.json        # shadcn-vue configuration
├── vite.config.ts         # Vite config (Tailwind plugin + @ alias)
├── tsconfig.app.json      # App TypeScript config
└── index.html             # HTML entry point
```

## Path Aliases

| Alias             | Resolves to                                 |
| ----------------- | ------------------------------------------- |
| `@/*`             | `src/*`                                     |
| `@/components`    | `src/components`                            |
| `@/components/ui` | `src/components/ui` (shadcn-vue components) |
| `@/lib`           | `src/lib`                                   |
| `@/composables`   | `src/composables`                           |

## Design Rules

- **Translation Order:** When displaying translation results in the UI, always follow this specific vertical order to maintain a consistent user experience:
  1. **English-to-English dictionary translation** (e.g., phonetics, part of speech, definitions).
  2. **English-to-Vietnamese word translation** (e.g., numbered list of translated words/phrases).
  3. **Full sentence English-to-Vietnamese translation** (e.g., the machine translation of the entire selected sentence).

## Architecture Rules

- **Prefer External Tools:** ALWAYS prefer to use external, existing tools and packages from the marketplace or npm rather than building functionality from scratch (e.g., use an existing dropzone or PDF parser).

## API Models — DO NOT CHANGE

> **IMPORTANT:** The model names below are fixed by the project owner. Never change them unless explicitly instructed.

| Provider | Model ID |
| -------- | -------- |
| Google Gemini | `gemini-3.1-flash-lite-preview` |
| Groq | `llama-3.3-70b-versatile` |


## Development Workflow

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Type-check + build
bun run build

# Preview production build
bun run preview
```

## Adding shadcn-vue Components

Use `npx` (not `bunx`) to add components — bunx is incompatible with the shadcn-vue CLI:

```bash
npx shadcn-vue@latest add <component-name>

# Examples:
npx shadcn-vue@latest add button
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add input
```

Components are placed in `src/components/ui/`. **Do not edit these files directly** — re-add them via the CLI if you need to reset.

## Styling Guidelines

- Use **Tailwind utility classes** for all layout and styling.
- Use the `cn()` helper from `@/lib/utils` to conditionally merge classes:
  ```ts
  import { cn } from "@/lib/utils";
  ```
- CSS custom properties (design tokens) are defined in `src/style.css` under `:root`. Prefer using these variables via shadcn's semantic class names (e.g. `bg-background`, `text-foreground`).
- **Do not use inline styles** unless absolutely necessary.

## Component Conventions

- All components use `<script setup lang="ts">` syntax.
- Props should be typed with `defineProps<{...}>()`.
- Composables live in `src/composables/` and are named `use*.ts`.
- Use `@/` absolute imports everywhere — no relative `../../` imports deeper than one level.

## Key Files

| File                                     | Purpose                                      |
| ---------------------------------------- | -------------------------------------------- |
| [`src/style.css`](./src/style.css)       | Tailwind import + shadcn CSS variable tokens |
| [`src/lib/utils.ts`](./src/lib/utils.ts) | `cn()` utility for class merging             |
| [`components.json`](./components.json)   | shadcn-vue registry config                   |
| [`vite.config.ts`](./vite.config.ts)     | Vite + Tailwind + path alias config          |
