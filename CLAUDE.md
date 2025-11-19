# AI Bootcamp - Claude Code Configuration

This file provides project-specific guidance for Claude Code when working on this Mastra AI project.

## Pre-Commit Checklist

Before committing any changes, **ALWAYS** run the following commands in order:

1. **Format code**: `npm run format`
2. **Type check**: `npm run typecheck`
3. **Build verification**: `npm run build` (if making significant changes)

If any of these commands fail, fix the issues before committing.

## Code Quality Standards

### TypeScript

- This project uses **strict TypeScript** mode - all type errors must be resolved
- Prefer explicit types for function parameters and return types
- Use Zod schemas for runtime validation where appropriate
- Leverage path aliases: Use `@lib/*` for imports from `src/mastra/lib/*`

### Code Formatting

- Prettier is configured with `prettier-plugin-organize-imports`
- All imports are automatically organized and sorted
- Follow the existing prettier configuration:
  - 2 spaces for indentation
  - Semicolons required
  - Double quotes for strings
  - 100 character line width
  - Trailing commas in multi-line structures

### Code Style

- Use descriptive variable and function names
- Prefer async/await over promise chains
- Use ES2022+ features (this is a modern Node.js >=20.9.0 project)
- Keep functions focused and single-purpose

## Project Structure

This is a **Mastra AI framework** project. Maintain the following structure:

```
src/mastra/
├── agents/        # AI agents with specific capabilities
├── workflows/     # Multi-step workflow definitions
├── tools/         # Tools that agents can use
├── scorers/       # Evaluation scorers for agent responses
└── lib/           # Shared utilities and configurations
```

### When Creating New Components

- **Agents**: Place in `src/mastra/agents/` - follow the pattern of existing agents
- **Workflows**: Place in `src/mastra/workflows/` - use the workflow step pattern
- **Tools**: Place in `src/mastra/tools/` - define clear tool schemas with Zod
- **Utilities**: Place in `src/mastra/lib/` - keep them reusable and well-typed

### Naming Conventions

- Files: Use kebab-case (e.g., `weather-agent.ts`, `get-transactions-tool.ts`)
- Classes/Types: Use PascalCase
- Variables/Functions: Use camelCase
- Constants: Use UPPER_SNAKE_CASE for true constants

## Environment & Dependencies

- Node.js version: **>=20.9.0** (check before suggesting features)
- Environment variables are managed in `.env` (never commit this file)
- Use `.env.example` as a reference for required environment variables

## Mastra-Specific Guidelines

### Agents

- Agents should have a clear, focused purpose
- Configure appropriate model and instructions
- Define tools that agents can use
- Consider memory requirements for stateful agents

### Workflows

- Break complex tasks into discrete steps
- Use proper error handling and validation between steps
- Document workflow inputs and outputs with Zod schemas

### Tools

- Define clear tool schemas using Zod
- Provide descriptive names and descriptions for LLM understanding
- Handle errors gracefully and return meaningful error messages
- Keep tools focused on a single responsibility

## Testing & Validation

- Test agents and workflows thoroughly before committing
- Use the Mastra dev server (`npm run dev`) for interactive testing
- Verify tool integrations work as expected
- Check that scorers evaluate correctly

## Common Commands

- `npm run dev` - Start Mastra development server
- `npm run build` - Build the project
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted correctly

## Git Workflow

- Keep commits focused and atomic
- Write clear, descriptive commit messages
- Always run pre-commit checklist before committing
- Review git diff before committing to catch unintended changes

## Security & Best Practices

- Never commit API keys or sensitive credentials
- Use environment variables for all secrets
- Validate and sanitize all external inputs
- Follow OWASP guidelines for security vulnerabilities
- Be cautious with user-provided data in prompts or tool calls

## Performance Considerations

- Be mindful of token usage in agent prompts
- Cache results when appropriate
- Consider rate limits for external API calls
- Optimize database queries (this project uses LibSQL)

## Documentation

- Add JSDoc comments for complex functions
- Document agent capabilities and intended use cases
- Keep workflow step descriptions clear and up-to-date
- Update this CLAUDE.md file when introducing new patterns or conventions
