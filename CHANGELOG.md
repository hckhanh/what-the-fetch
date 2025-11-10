# what-the-fetch

## 2.0.0

### Major Changes

- 59203ac: Rework `createFetch()` to support shared `RequestInit` and improve validation logic with `validateData()`.

  **BREAKING CHANGES:**

  1. **New `sharedInit` parameter in `createFetch()`**

     - Added optional third parameter `sharedInit?: RequestInit` to `createFetch()`
     - Allows setting shared request options (like headers) that apply to all requests
     - Shared options are merged with per-request options

     ```typescript
     // Before
     const apiFetch = createFetch(api, "https://api.example.com");

     // After - with shared headers
     const apiFetch = createFetch(api, "https://api.example.com", {
       headers: { Authorization: "Bearer token" },
     });
     ```

  2. **Options parameter is now optional**

     - The second parameter of the fetch function changed from `options` to `options?`
     - Enables simpler API calls when no parameters are needed

     ```typescript
     // Before - required empty object
     await apiFetch("/users", {});

     // After - options are optional
     await apiFetch("/users");
     ```

  3. **Renamed third parameter from `baseInit` to `init`**

     - The per-request RequestInit parameter renamed for clarity
     - This parameter is merged with `sharedInit` from `createFetch()`

     ```typescript
     // Before
     await apiFetch("/users", options, baseInit);

     // After
     await apiFetch("/users", options, init);
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
  await apiFetch("/endpoint", options, baseInit);

  // New API - Basic usage (no changes needed if not using third param)
  const apiFetch = createFetch(api, baseUrl);
  await apiFetch("/endpoint", options);

  // New API - With shared configuration
  const apiFetch = createFetch(api, baseUrl, sharedInit);
  await apiFetch("/endpoint", options, init);

  // New API - Optional options parameter
  await apiFetch("/endpoint"); // No options needed
  ```

  **Files Updated:**

  - `src/index.ts`: Updated `createFetch()` signature and implementation
  - `src/utils.ts`: Replaced `validateResponse()` with `validateData()`
  - `src/types.ts`: Updated `FetchOptions` to make body required when schema exists
  - Documentation and tests updated to reflect new API

### Patch Changes

- 59203ac: Simplify `StandardSchemaV1` type parameters across codebase and update related typings.

  **Type Changes:**

  - Simplified `StandardSchemaV1` usage from `StandardSchemaV1<T, unknown>` to `StandardSchemaV1<T>` throughout the codebase
  - Updated `ApiSchema`, `FetchOptions`, and `ApiResponse` type definitions to use the simplified signature
  - This change aligns with Standard Schema specification's usage patterns and improves type readability

  **Files Updated:**

  - `src/types.ts`: Simplified all `StandardSchemaV1` type parameters
  - `test/createFetch.test.ts`: Updated test helper and assertions
  - `docs/content/docs/api-reference.mdx`: Updated documentation examples

## 1.0.3

### Patch Changes

- 0f609bc: Update dependency constraints for `@standard-schema/spec` and `fast-url` to use caret ranges

## 1.0.2

### Patch Changes

- bbf7b55: Fix the linked dependencies in JSR package

## 1.0.1

### Patch Changes

- 6f915ca: Renamed package from `afetch` to `what-the-fetch` to comply with npm naming requirements. The name `afetch` was too similar to the existing `a-fetch` package on npm.

  **Breaking Changes:**

  - Package import name changed from `afetch` to `what-the-fetch`
  - JSR package name changed from `@hckhanh/afetch` to `@hckhanh/what-the-fetch`

  **Migration:**

  Update your imports:

  ```typescript
  // Before
  import { createFetch } from "afetch";

  // After
  import { createFetch } from "what-the-fetch";
  ```

  For JSR users:

  ```bash
  # Before
  deno add jsr:@hckhanh/afetch

  # After
  deno add jsr:@hckhanh/what-the-fetch
  ```

  No functional changes were made - only the package name was updated across all documentation, examples, and configuration files.

## 1.0.0

### Major Changes

- 5687b56: Initial release of what-the-fetch - a type-safe API client with schema validation using Standard Schema.

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
  import { createFetch } from "what-the-fetch";
  import { z } from "zod";

  const api = {
    "/users/:id": {
      params: z.object({ id: z.number() }),
      response: z.object({ id: z.number(), name: z.string() }),
    },
  };

  const apiFetch = createFetch(api, "https://api.example.com");
  const user = await apiFetch("/users/:id", { params: { id: 123 } });
  ```

## 0.0.0

### Initial Release

- Initial implementation of type-safe API client with schema validation
- Support for Standard Schema specification
- Integration with fast-url for URL building
- Full TypeScript type inference
- Support for path parameters, query parameters, and request body
- Automatic response validation
