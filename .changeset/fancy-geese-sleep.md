---
"what-the-fetch": minor
---

Add HTTP method prefix notation (@method/path) for declaring methods in API schema paths

### New Feature: HTTP Method Prefix Notation

You can now declare HTTP methods directly in API schema paths using the `@method/path` syntax:

```typescript
const api = {
  '@get/users': {
    response: z.array(z.object({ id: z.number(), name: z.string() }))
  },
  '@post/users': {
    body: z.object({ name: z.string(), email: z.string() }),
    response: z.object({ id: z.number(), name: z.string(), email: z.string() })
  },
  '@put/users/:id': {
    params: z.object({ id: z.number() }),
    body: z.object({ name: z.string() }),
    response: z.object({ id: z.number(), name: z.string() })
  }
} as const;
```

**Key Features:**
- Supports all HTTP methods: `@get`, `@post`, `@put`, `@delete`, `@patch`, etc.
- Method names are case-insensitive (normalized to uppercase)
- `@get/api` is equivalent to `/api` in URL, only the HTTP method differs
- Backward compatible: paths without prefix continue to work as before
- Type-safe: `RequestInit` parameters are now `Omit<RequestInit, 'method'>` to prevent method override

**Implementation:**
- Added `parseMethodFromPath()` utility function to extract method prefix
- Updated `createFetch()` to use the extracted method from path prefix
- Restricted `RequestInit` types to prevent method override
