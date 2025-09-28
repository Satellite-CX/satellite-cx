## Testing instructions

- Place all test files in the 'tests' folder
- Use `bun` as the test framework
- Run tests using `pnpm test --filter @repo/trpc`

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
