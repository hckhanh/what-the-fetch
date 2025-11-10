---
"what-the-fetch": major
---

Rework `createFetch()` to support shared `RequestInit` and improve validation logic with `validateData()`.

**BREAKING CHANGES:**

1. **New `sharedInit` parameter in `createFetch()`**
   - Added optional third parameter `sharedInit?: RequestInit` to `createFetch()`
   - Allows setting shared request options (like headers) that apply to all requests
   - Shared options are merged with per-request options
   ```typescript
   // Before
   const apiFetch = createFetch(api, 'https://api.example.com');
   
   // After - with shared headers
   const apiFetch = createFetch(
     api,
     'https://api.example.com',
     { headers: { 'Authorization': 'Bearer token' } }
   );
   ```

2. **Options parameter is now optional**
   - The second parameter of the fetch function changed from `options` to `options?`
   - Enables simpler API calls when no parameters are needed
   ```typescript
   // Before - required empty object
   await apiFetch('/users', {});
   
   // After - options are optional
   await apiFetch('/users');
   ```

3. **Renamed third parameter from `baseInit` to `init`**
   - The per-request RequestInit parameter renamed for clarity
   - This parameter is merged with `sharedInit` from `createFetch()`
   ```typescript
   // Before
   await apiFetch('/users', options, baseInit);
   
   // After
   await apiFetch('/users', options, init);
   ```

4. **Body parameter in `FetchOptions` is now required when body schema exists**
   - Changed from `{ body?: Body }` to `{ body: Body }` in type definition
   - More accurately reflects that body must be provided when schema is defined
   - TypeScript will now correctly require the body parameter

5. **Validation logic refactored**
   - Replaced `validateResponse()` with `validateData()` utility
   - `validateData()` now accepts the full API path schema object and a key (e.g., 'response') to extract the specific schema
   - Function signature: `validateData(apiSchema: T[Path], key: keyof T[Path], data: unknown)`
   - Extracts the schema internally using the provided key, improving flexibility and type safety
   - Validation logic directly validates data against the extracted schema
   - Better separation of concerns and improved type clarity

**Migration Guide:**

```typescript
// Old API
const apiFetch = createFetch(api, baseUrl);
await apiFetch('/endpoint', options, baseInit);

// New API - Basic usage (no changes needed if not using third param)
const apiFetch = createFetch(api, baseUrl);
await apiFetch('/endpoint', options);

// New API - With shared configuration
const apiFetch = createFetch(api, baseUrl, sharedInit);
await apiFetch('/endpoint', options, init);

// New API - Optional options parameter
await apiFetch('/endpoint'); // No options needed
```

**Files Updated:**
- `src/index.ts`: Updated `createFetch()` signature and implementation
- `src/utils.ts`: Replaced `validateResponse()` with `validateData()`
- `src/types.ts`: Updated `FetchOptions` to make body required when schema exists
- Documentation and tests updated to reflect new API
