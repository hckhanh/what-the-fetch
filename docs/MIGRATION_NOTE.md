# Documentation Website Migration

> **Status**: Tracked as separate task  
> **Timeline**: Post-merge (after core library release)  
> **Tracking**: To be created as GitHub issue after PR merge

## Context

This folder contains a Next.js documentation website inherited from the fast-url template. The core afetch library implementation is complete and documented in the main README.md. The documentation website migration is intentionally deferred to maintain focus on the core library release.

## Scope for Future Documentation Website Update

When ready to launch the documentation website, the following changes will be needed:

### Content Updates
1. `docs/content/docs/index.mdx` - Replace fast-url introduction with afetch overview
2. `docs/content/docs/getting-started.mdx` - Replace with afetch installation and usage examples
3. `docs/content/docs/api-reference.mdx` - Document afetch API (createFetch, types, etc.)
4. `docs/content/docs/meta.json` - Update navigation structure

### Configuration
5. `docs/package.json` - Update project name, description, and dependencies
6. `docs/next.config.mjs` - Review and update any fast-url specific configuration
7. `docs/source.config.ts` - Update source configuration if needed

### Assets
8. `docs/public/urlcat-*.svg` - Remove fast-url/urlcat SVG files
9. Create new afetch-specific assets/diagrams if needed

## Decision Rationale

- **Core library first**: The afetch library is fully functional with comprehensive README documentation
- **Separate concerns**: Documentation website is a presentation layer that can be updated independently
- **Release velocity**: Deferring docs site allows faster initial library release
- **Proper planning**: Docs site deserves dedicated time for quality content and examples
