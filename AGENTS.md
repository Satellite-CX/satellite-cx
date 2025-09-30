# AGENTS instructions

## Dev environment tips

- Use `pnpm` for dependency management
- Use `pnpm dlx turbo run where <project_name>` to jump to a package instead of scanning with `ls`.
- Run `pnpm install --filter <project_name>` to add the package to your workspace so Vite, ESLint, and TypeScript can see it.
- Check the name field inside each package's package.json to confirm the right name—skip the top-level one.

## Testing instructions

- Use `bun` as the test framework

## Code style instructions

- Use meaningful names – no `data` or `obj`.
- Keep functions small – do one thing only.
- Avoid nesting – prefer early returns over deep `if/else`.
- No magic values – use constants, enums, or literal types.
- Avoid comments – code should explain itself
- Prefer pure functions – avoid hidden side effects.
- Favor immutability – use `const`, `readonly`, avoid mutation.
- Don’t use `any` – use real types or generics.
- Delete dead code – no commented-out leftovers.
- Keep tests clean – readable, fast, and documenting behavior.
