# EMR Project Rules and Best Practices

This is a condensed copy of team rules for quick reference. Keep this file updated.

## Next.js App Router TypeScript Rules
- For async server components, type `params` and `searchParams` as `Promise<...>` and await them.

## Package Manager
- Use Bun. Run scripts with `bun run <script>`.

## TailwindCSS
- Using TailwindCSS v4 with CSS-first config. See `app/globals.css`.

## Linting
- ESLint must be clean before merging. Avoid anonymous default exports.

## Dev Server
```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
bun run dev
```


