# EMR Project Troubleshooting Guide

## General Troubleshooting Process
1. **Check Documentation First**
   - Review official documentation
   - Search GitHub issues
   - Check recent updates/changes

2. **Common Issues Resolution**
   - Clear cache and reinstall:
     ```bash
     rm -rf .next node_modules package-lock.json bun.lockb
     bun install
     ```
   - Kill existing dev servers:
     ```bash
     lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
     ```

3. **Document Solutions**
   - Update this guide with new solutions
   - Share with team members
   - Reference official documentation

## Known Issues and Solutions
1. **Port Already in Use**
   - **ALWAYS** kill existing ports before starting the server:
     ```bash
     # Kill default Next.js port
     lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
     
     # If you've been using other ports, kill those too
     lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
     lsof -i :3002 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
     ```
   - This prevents the server from using alternative ports (3001, 3002, etc.)
   - Always use port 3000 for consistency across the team

2. **Build Errors**
   - Clear cache and node_modules
   - Check Next.js and TailwindCSS versions
   - Verify PostCSS configuration

3. **Dependency Issues**
   - Use Bun for consistency
   - Check version compatibility
   - Update to latest versions when possible

For complete rules and guidelines, see [rules.md](./rules.md)
