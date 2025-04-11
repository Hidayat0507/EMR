# EMR Project Rules and Best Practices

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