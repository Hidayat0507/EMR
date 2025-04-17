# EMR Project Setup Guide

## Prerequisites
- Node.js (latest LTS version)
- Bun (latest version)
- Git

## Initial Setup
1. Clone the repository
2. Install Bun if not already installed:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
3. Install dependencies:
   ```bash
   bun install
   ```

## Configuration
1. Copy `.env.example` to `.env.local`
2. Configure your environment variables
3. Review the main rules document at `/docs/rules/rules.md`

## Development Workflow
1. Before starting the development server, always kill existing instances:
   ```bash
   # Kill any process on port 3000 (default Next.js port)
   lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
   ```

2. Start the development server:
   ```bash
   bun run dev
   ```
3. Follow the coding standards in `/docs/rules/rules.md`
4. Test your changes locally before committing

## Important Rules Reference
- Always use Bun as package manager
- Keep Next.js updated to latest version
- Use TailwindCSS v4
- Follow TypeScript strict mode

For complete rules and guidelines, see [rules.md](./rules.md)
