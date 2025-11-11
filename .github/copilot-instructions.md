# Copilot Instructions for what-the-fetch

## Project Overview

This is **what-the-fetch**, a type-safe API client library with schema validation using Standard Schema. The project provides end-to-end type inference for API requests and responses, integrating with popular schema validation libraries like Zod, Valibot, and ArkType.

## Installation & Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Format code
npm run format
```

## Code Style & Standards

### Formatter & Linter
- **Biome** is used for both formatting and linting
- Single quotes for strings
- Semicolons only when needed (ASI style)
- Arrow function parentheses always included
- 2-space indentation
- Run `npm run format` to auto-fix style issues

### TypeScript Guidelines
- Use strict TypeScript with full type safety
- Leverage type inference wherever possible
- Use `type` for type aliases (not `interface`) for consistency
- Include JSDoc comments for public APIs
- Use `.ts` extension in imports (e.g., `from './types.ts'`)
- Prefer `const` over `let`
- Use `unknown` instead of `any` where possible

### Testing
- Tests are located in the `test/` directory
- Use Vitest as the test framework
- Mock external dependencies (e.g., `global.fetch`)
- Test file naming: `*.test.ts`
- Include tests for:
  - Happy paths
  - Error cases
  - Edge cases
  - Type safety validations

## Project Structure

```
src/
  ├── index.ts       # Main export and createFetch function
  ├── types.ts       # Type definitions
  └── utils.ts       # Utility functions (e.g., validation)
test/
  └── createFetch.test.ts  # Test suite
```

## Key Dependencies

- **@standard-schema/spec**: Standard Schema specification for validation
- **fast-url**: URL building and parameter substitution
- **vitest**: Testing framework
- **biome**: Linting and formatting
- **tsdown**: TypeScript bundler powered by rolldown

## Development Workflow

1. Make code changes in `src/`
2. Add tests in `test/`
3. Run `npm run format` to auto-format
4. Run `npm test` to verify tests pass
5. Run `npm run build` to ensure the build succeeds
6. Add a changeset for release tracking (see below)

## Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

### When to Add a Changeset

Add a changeset when you make changes that affect the public API or user-facing behavior:
- Adding new features (minor version bump)
- Fixing bugs (patch version bump)
- Breaking changes (major version bump)
- Performance improvements
- Documentation changes that affect usage

### How to Add a Changeset

Run the following command and follow the interactive prompts:

```bash
npx changeset add
```

The CLI will ask you:
1. **What type of change**: Select `patch`, `minor`, or `major`
   - **patch**: Bug fixes, documentation updates, internal improvements
   - **minor**: New features, backward-compatible changes
   - **major**: Breaking changes that require user code changes
2. **Summary**: Provide a clear, concise summary of the change

### Changeset Best Practices

- **Be descriptive**: Write summaries that explain what changed and why
- **Include examples**: For new features, include code examples in the changeset
- **One changeset per PR**: Generally, create one changeset per pull request
- **Edit the changeset file**: After creation, you can manually edit `.changeset/*.md` to add more details, examples, or formatting

### Changeset File Format

Changesets are stored in `.changeset/*.md` files with the following format:

```markdown
---
"what-the-fetch": minor
---

Brief summary of the change

### Optional: Detailed Description

More details, code examples, migration guides, etc.
```

## API Design Principles

- **Type Safety First**: All APIs must provide full type inference
- **Standard Schema Compatible**: Work with any schema library implementing Standard Schema
- **Minimal Surface Area**: Keep the API simple and focused
- **Zero Breaking Changes**: Maintain backward compatibility
- **Bundle Size**: Keep dependencies minimal and bundle size small

## Common Tasks

### Adding a New Feature
1. Define types in `types.ts` if needed
2. Implement functionality in `index.ts` or `utils.ts`
3. Add JSDoc comments with examples
4. Write comprehensive tests
5. Update README.md if adding public APIs
6. Add a changeset with `npx changeset add` (select "minor")

### Fixing a Bug
1. Write a failing test that reproduces the bug
2. Fix the bug in the source code
3. Verify the test passes
4. Add regression tests if needed
5. Add a changeset with `npx changeset add` (select "patch")

### Refactoring
1. Ensure all tests pass before starting
2. Make incremental changes
3. Run tests frequently
4. Do not change public API signatures without careful consideration

## Important Notes

- This project uses **Bun** in CI but supports all package managers
- The package is published to both npm and JSR (Deno)
- The library must remain framework-agnostic
- Response validation happens automatically when schemas are provided
- Default method is GET; POST is used when body is present
- Custom headers merge with default headers (Content-Type: application/json)
