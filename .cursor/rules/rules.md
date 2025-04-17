# EMR Project Rules and Best Practices

## Rules Location and Access
- All project rules are maintained in:
  1. `/docs/rules/` directory:
     - `rules.md` - Main rules document (this file)
     - `setup.md` - Setup instructions
     - `troubleshooting.md` - Common issues and solutions
  2. Project Wiki (if applicable)
  3. Team documentation portal (if applicable)

- Quick Access:
  - Bookmark the rules directory in your IDE
  - Pin the rules in your team's communication channel
  - Keep a local copy in your development environment
  - Reference these rules in PR templates

- Rules Maintenance:
  1. Rules should be reviewed and updated monthly
  2. All team members can propose rule changes via PR
  3. Rule changes must be approved by team lead
  4. Changes must be communicated to all team members

## Next.js App Router TypeScript Rules

### Page Props Typing

#### 1. Regular Pages (Non-Async)
For non-async pages/components, use regular object types:
```typescript
type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function Page({ params }: Props) {
  return <div>ID: {params.id}</div>
}
```

#### 2. Async Server Components
For async pages/server components, params MUST be Promise types:
```typescript
type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: Props) {
  // Must await the params
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const id = resolvedParams.id;
  
  return <div>ID: {id}</div>
}
```

### Key Points
1. If your component is `async`, params MUST be typed as a Promise
2. If using params in an async component, you MUST await them before use
3. Both `params` and `searchParams` need to be Promises in async components
4. Use `Promise.all` when you need both params and searchParams to avoid sequential awaits

### Applies To
- Dynamic route segments (`[id]`, `[slug]`, etc.)
- Catch-all routes (`[...slug]`)
- Optional catch-all routes (`[[...slug]]`)

## Project Structure

### File Naming
- Use kebab-case for file names: `medical-record.tsx`
- Use PascalCase for component names: `MedicalRecord`
- Use camelCase for functions and variables: `getMedicalRecord`

### Directory Structure
```
app/
├── components/     # Shared components
├── lib/           # Utility functions, types, and data fetching
├── hooks/         # Custom React hooks
└── (routes)/      # Page components and route handlers
```

## Data Fetching
- Use Server Components by default
- Only use Client Components when needed (interactivity, browser APIs)
- Keep data fetching close to where it's used
- Use proper error handling and loading states

## Type Safety
- Enable strict mode in TypeScript
- Define proper interfaces for all data structures
- Use zod for runtime type validation
- Avoid `any` type unless absolutely necessary

## Performance
- Use proper image optimization with `next/image`
- Implement proper loading states
- Use proper caching strategies
- Minimize client-side JavaScript

## Security
- Validate all user inputs
- Implement proper authentication checks
- Use environment variables for sensitive data
- Follow HIPAA compliance guidelines for medical data

## Testing
- Write unit tests for critical functions
- Implement integration tests for key flows
- Use proper test data that doesn't contain real patient information

## Error Handling
- Implement proper error boundaries
- Use proper logging
- Show user-friendly error messages
- Handle edge cases appropriately

## Accessibility
- Follow WCAG guidelines
- Use proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

## State Management
- Use React Query for server state
- Use React Context or Zustand for client state
- Keep state as local as possible
- Implement proper loading and error states

## Code Style
- Use ESLint for code linting
- Use Prettier for code formatting
- Follow consistent naming conventions
- Write clear comments and documentation

## Git Workflow
- Use meaningful commit messages
- Create feature branches
- Review code before merging
- Keep commits focused and atomic

## Documentation
- Document key features and workflows
- Keep API documentation up to date
- Document environment setup
- Include troubleshooting guides

## Deployment
- Use proper CI/CD pipelines
- Implement staging environments
- Use proper monitoring and logging
- Have rollback procedures in place

## Problem Solving and Documentation
- If encountering the same error multiple times:
  1. **ALWAYS** consult official documentation first:
     - Next.js docs: https://nextjs.org/docs
     - TailwindCSS v4 docs: https://tailwindcss.com
     - Bun docs: https://bun.sh/docs
  2. Check GitHub issues for similar problems
  3. Look for recent updates or breaking changes
  4. Document the solution in the project wiki/README
- Before implementing fixes:
  1. Understand the root cause from documentation
  2. Test in a branch before applying to main
  3. Share the solution with the team
- Keep a troubleshooting log:
  1. Document the error
  2. Document the solution
  3. Document any configuration changes
  4. Share resources and documentation links

## Troubleshooting
- **FIRST STEP**: Always check official documentation for your specific error
- For recurring issues, follow the Problem Solving and Documentation guidelines above
- If encountering webpack/build issues:
  1. Check Next.js documentation for breaking changes
  2. Clear all caches: `.next/`, `node_modules/`
  3. Remove lock files: `package-lock.json`, `bun.lockb`
  4. Fresh install: `bun install`
  5. Start dev server: `bun run dev`
- For dependency conflicts:
  1. Check package compatibility in documentation
  2. Use exact versions if needed
  3. Document version requirements
- Document solutions in project wiki/README for team reference

# Project Rules and Guidelines

## Next.js Version
- **ALWAYS** use the latest version of Next.js
- Current version: 15.3.0
- Install command: `bun add next@latest`

## Package Manager
- Use **Bun** as the package manager
- Do not mix package managers (no npm or yarn)
- Installation commands should use `bun add` instead of `npm install`
- Scripts should be run with `bun run` instead of `npm run`

## Dependencies
- Keep dependencies up to date with `bun add @latest`
- **Required Versions**:
  - Next.js: Latest version (`bun add next@latest`)
  - TailwindCSS: v4.x (`bun add tailwindcss@latest`)

## Development
- **ALWAYS** kill existing development servers before starting a new one:
  ```bash
  # Kill any process on port 3000 (default Next.js port)
  lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  
  # If you've been using other ports, kill those too
  lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  lsof -i :3002 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  
  # Then start your development server
  bun run dev
  ```
- Always clear cache when switching package managers or making major dependency updates:
  ```bash
  rm -rf .next node_modules package-lock.json bun.lockb
  bun install
  ```

## Version Control
- Do not commit the following files/directories:
  - `.next/`
  - `node_modules/`
  - `bun.lockb`
  - `.env.local`

## CSS and Styling
- **MUST** use TailwindCSS version 4.x
- Install command: `bun add tailwindcss@latest`
- Keep Tailwind config up to date with v4 features
- Use modern Tailwind v4 syntax and features

## Version Control
- Do not commit the following files/directories:
  - `.next/`
  - `node_modules/`
  - `bun.lockb`
  - `.env.local`

## Troubleshooting
- If encountering webpack/build issues:
  1. Ensure PostCSS is properly configured
  2. Required packages: `postcss-import`, `postcss-nesting`
  3. TailwindCSS version: 4.x (alpha)

## CSS and Styling
- **MUST** use TailwindCSS version 4.x
- Install command: `bun add tailwindcss@latest`
- Keep Tailwind config up to date with v4 features
- Use modern Tailwind v4 syntax and features 