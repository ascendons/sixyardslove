# Six Yards Love Nexus — Frontend

Vite + React + TypeScript frontend for Six Yards Love.

## Run

```sh
npm i
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8081`
- Build: `npm run build`
- Preview: `npm run preview`

## Project structure

- **[docs/STRUCTURE.md](docs/STRUCTURE.md)** — `src/` layout, where to add components/pages/hooks, shared logic.
- **Doc-first workflow:** describe changes in **[docs/DIRECTIVES.md](docs/DIRECTIVES.md)** under _To implement_, then ask the AI to "Implement the directives".
- **Coding rules:** `.cursor/rules/` — `coding-standards.mdc`, `typescript-react.mdc`.

## India map (homepage)

The Pan-India Presence map uses **MapmyIndia** when `VITE_MAPMYINDIA_API_KEY` is set in `.env`. Without it, **OpenStreetMap** tiles are used so the map and city markers are always visible. Copy `.env.example` to `.env` and add a [free MapmyIndia API key](https://www.mapmyindia.com/api/maps-api-free/) to use India‑compliant base maps.

## Stack

- Vite, TypeScript, React
- shadcn-ui, Tailwind CSS
- React Router, TanStack Query

mvn spring-boot:run -Dspring-boot.run.profiles=dev
npm run dev
