---
"afetch": major
---

Initial release of afetch - a type-safe API client with schema validation using Standard Schema.

**Breaking Changes:**
- First major release, establishing the public API

**Features:**
- Type-safe API client with full TypeScript inference
- Schema validation using Standard Schema (compatible with Zod, Valibot, ArkType, etc.)
- Support for path parameters, query parameters, and request body
- Automatic response validation
- Integration with fast-url for URL building
- Comprehensive JSDoc documentation for JSR compliance

**API:**
- `createFetch(schema, baseUrl)`: Creates a typed fetch function
- Exported types: `ApiSchema`, `ApiPath`, `FetchOptions`, `ApiResponse`

**Example:**
```typescript
import { createFetch } from 'afetch';
import { z } from 'zod';

const api = {
  '/users/:id': {
    params: z.object({ id: z.number() }),
    response: z.object({ id: z.number(), name: z.string() })
  }
};

const apiFetch = createFetch(api, 'https://api.example.com');
const user = await apiFetch('/users/:id', { params: { id: 123 } });
```
