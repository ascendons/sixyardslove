# Directives — Doc-first workflow

**You (human):** Describe changes here.  
**AI:** Read this file and implement the code changes.

---

## How to use

1. **You** add or edit items under **To implement** below. Be as specific or high-level as you like.
2. **You** tell the AI (e.g. in chat): _"Implement the directives in docs/DIRECTIVES.md"_ or _"Apply the changes in DIRECTIVES"_.
3. **AI** reads this file, implements the changes, and (optionally) moves done items to **Done** and bumps the "Last implemented" note.

Keep **To implement** as the single list of _current_ work; move completed items to **Done** when you want a record.

---

## To implement

_(Add your change requests below. One bullet or a short spec per item.)_

- _(none right now)_

---

## Done

_(Items moved here after implementation — optional, for your own log.)_

- _(none)_

---

## Last implemented

- _Not set — AI will update this when it applies directives._

---

## Notes for AI

- **Follow the project Cursor rules** in `.cursor/rules/` (e.g. `coding-standards.mdc` is alwaysApply). Uphold them on every change.
- Follow [docs/STRUCTURE.md](STRUCTURE.md) for where to put new code.
- Prefer existing styles from `src/index.css` and `tailwind.config.ts`; reuse components from `@/components`, `@/content`, `@/lib`.
- After implementing, you may move completed bullets from **To implement** to **Done** and set **Last implemented** to the current date—only if the user hasn’t disabled that.
