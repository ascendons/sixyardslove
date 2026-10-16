# Project Structure

How to find, add, and reuse code in `syl-web` and the repo.

## Repo layout

The project root is `syl/`:

- **`syl-web/`** — Frontend (Vite + React). This doc focuses on `syl-web/src/`.
- **`backend/`** — A Spring Boot backend will be added here later.

## Doc-first workflow

- **You** describe changes in **[docs/DIRECTIVES.md](DIRECTIVES.md)** under _To implement_.
- **AI** reads DIRECTIVES and implements the code.

When asking for changes, you can say: _"Implement the directives in docs/DIRECTIVES.md"_ or _"Apply DIRECTIVES"_.

## Cursor rules (always upheld)

Project rules live in **`.cursor/rules/`** at the repo root. Cursor applies them automatically:

- **`coding-standards.mdc`** (always) — Doc-first, STRUCTURE, reuse, no breakage, imports, styling, routes. When changing an existing component: scan the tree for usages and barrels, update call sites, run build, test, and lint.
- **`typescript-react.mdc`** (_.ts, _.tsx) — Types, no `any`, functional components, hooks, error handling.

The AI is instructed to follow these on every change. Edit the `.mdc` files to change or add rules.

## Directory Overview

```
src/
├── components/       # React components
│   ├── common/       # Shared (NavLink, etc.) — use @/components/common or @/components
│   ├── home/         # Homepage sections (Hero, About, CTA, ...) — use @/components/home or @/components
│   ├── layout/       # Header, Footer, Layout — use @/components/layout or @/components
│   ├── ui/           # Shadcn/UI primitives (Button, Input, …) — import from @/components/ui/<name>
│   └── index.ts      # Barrel: layout, home, common (not ui)
├── content/          # Copy, brand, config (NAV_ITEMS, SECTORS, …) — use @/content or @/content/brand
├── hooks/            # useToast, useIsMobile, … — use @/hooks or @/hooks/<name>
├── lib/              # Utils (cn), helpers — use @/lib or @/lib/utils
├── pages/            # Route-level pages — use @/pages or @/pages/<Name>
├── routes.tsx        # Central route config (add new routes here)
├── assets/           # Images, static files — use @/assets/...
└── main.tsx, App.tsx, index.css, vite-env.d.ts
```

## Indexing & Imports

| What you need          | Import from                                            |
| ---------------------- | ------------------------------------------------------ |
| Layout, Header, Footer | `@/components/layout` or `@/components`                |
| Home sections          | `@/components/home` or `@/components`                  |
| NavLink, shared UI     | `@/components/common` or `@/components`                |
| Button, Input, etc.    | `@/components/ui/button`, `@/components/ui/input`, …   |
| Brand, NAV_ITEMS       | `@/content` or `@/content/brand`                       |
| useToast, useIsMobile  | `@/hooks` or `@/hooks/use-toast`, `@/hooks/use-mobile` |
| cn, helpers            | `@/lib` or `@/lib/utils`                               |
| Page components        | `@/pages` or `@/pages/About`                           |

Path alias `@/` resolves to `src/`.

## Tailwind CSS (styling)

Tailwind is the main styling layer and is already included:

- **Entry**: `src/index.css` (`@tailwind base/components/utilities`) is imported from `main.tsx`.
- **Config**: `tailwind.config.ts` — theme, content paths, `tailwindcss-animate`, `@tailwindcss/typography`.
- **PostCSS**: `postcss.config.js` — `tailwindcss` + `autoprefixer`.
- **Design tokens**: `index.css` holds Six Yards Love CSS variables (`--primary`, `--secondary`, `--forest`, `--ochre`, etc.) and `@layer components` classes (`.container-institutional`, `.section-padding`, `.badge-producer`, etc.).

Use Tailwind classes in JSX and `cn()` from `@/lib` to merge with `className`. For prose/ long-form text, use the `prose` / `prose-institutional` utilities from `@tailwindcss/typography`.

## Adding a New Component

1. **Layout / shared / page-specific block**
   - Put in `components/layout`, `components/common`, or a new `components/<feature>/` (e.g. `components/forms`).
   - Export from the folder’s `index.ts` (e.g. `components/common/index.ts`).
   - Optional: re-export from `components/index.ts` if it should be available via `@/components`.

2. **UI primitive (Shadcn-style)**
   - Add to `components/ui/<name>.tsx`.
   - Import directly: `import { Button } from "@/components/ui/button"`.
   - No need to add to `components/index.ts`.

3. **New home section**
   - Add `components/home/<Section>.tsx` and export it from `components/home/index.ts`.
   - Use in `pages/Index.tsx` (or the right page).

## Adding a New Page / Route

1. Create `src/pages/<PageName>.tsx` (default export).
2. Export from `src/pages/index.ts`:  
   `export { default as PageName } from "./PageName";`
3. In `src/routes.tsx`, add (above the `path="*"` route):  
   `<Route path="/your-path" element={<PageName />} />`

## Reusing Shared Logic

- **Copy / brand / constants** → `src/content/` (e.g. `brand.ts`). Use `@/content` or `@/content/brand`.
- **Pure helpers, formatters, validators** → `src/lib/`. Use `@/lib` or `@/lib/utils` (add `lib/validators.ts` etc. as needed).
- **React hooks** → `src/hooks/`. Export from `hooks/index.ts` and import via `@/hooks` or `@/hooks/<name>`.
- **Shared components** (e.g. NavLink, custom form controls) → `src/components/common/`. Export via `components/common/index.ts` and optionally `components/index.ts`.

## Testing

- **Run:** `npm run test` (one-off), `npm run test:watch` (watch), `npm run test:coverage` (with coverage).
- **Layout:** Tests live next to source as `*.test.ts` or `*.test.tsx` (e.g. `utils.test.ts`, `Header.test.tsx`). Setup and helpers: `src/test/setup.ts`, `src/test/test-utils.tsx`.
- **Helpers:** `render` from `@/test/test-utils` wraps with `MemoryRouter`, `QueryClientProvider`, `TooltipProvider`. Use `initialEntries` for a specific route.
- **Mocks:** `setup.ts` provides `matchMedia`, `IntersectionObserver`, `ResizeObserver`, and a `react-leaflet` mock for `IndiaMapSection`.
- **Adding tests:** For new components, pages, or `lib`/`content`/`hooks`, add a colocated `*.test.ts(x)` that asserts render, links, and key content. Run `npm run test` after edits to avoid regressions.

## Conventions

- Use `@/` for `src/` (configured in `tsconfig` and Vite).
- Prefer barrel imports for `layout`, `home`, `common`, `content`, `hooks`, `lib`, `pages` when importing several symbols.
- Keep `components/ui` as direct imports (`@/components/ui/<name>`).
- Add new routes only in `src/routes.tsx`; keep the `path="*"` (NotFound) route last.
