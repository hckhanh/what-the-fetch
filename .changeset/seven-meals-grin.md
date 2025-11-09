---
"what-the-fetch": major
---

Renamed package from `afetch` to `what-the-fetch` to comply with npm naming requirements. The name `afetch` was too similar to the existing `a-fetch` package on npm.

**Breaking Changes:**

- Package import name changed from `afetch` to `what-the-fetch`
- JSR package name changed from `@hckhanh/afetch` to `@hckhanh/what-the-fetch`

**Migration:**

Update your imports:

```typescript
// Before
import { createFetch } from 'afetch';

// After
import { createFetch } from 'what-the-fetch';
```

For JSR users:

```bash
# Before
deno add jsr:@hckhanh/afetch

# After
deno add jsr:@hckhanh/what-the-fetch
```

No functional changes were made - only the package name was updated across all documentation, examples, and configuration files.
