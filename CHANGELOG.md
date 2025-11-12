# what-the-fetch

## 2.2.1

### Patch Changes

- 4c749a5: Link "Standard Schema" references to https://standardschema.dev in documentation

  Updated all unlinked "Standard Schema" text throughout documentation files (README.md, docs/content/docs/index.mdx, docs/content/docs/getting-started.mdx, and docs/content/docs/api-reference.mdx) to include hyperlinks to https://standardschema.dev, providing readers direct access to the specification.

## 2.2.0

### Minor Changes

- b5be69a: Add HTTP method prefix notation (@method/path) for declaring methods in API schema paths

  ### New Feature: HTTP Method Prefix Notation

  You can now declare HTTP methods directly in API schema paths using the `@method/path` syntax:

  ```typescript
  const api = {
    "@get/users": {
      response: z.array(z.object({ id: z.number(), name: z.string() })),
    },
    "@post/users": {
      body: z.object({ name: z.string(), email: z.string() }),
      response: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
      }),
    },
    "@put/users/:id": {
      params: z.object({ id: z.number() }),
      body: z.object({ name: z.string() }),
      response: z.object({ id: z.number(), name: z.string() }),
    },
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

### Patch Changes

- 52df593: Update `fast-url` dependency to version 6.0.2 for significant performance optimizations. This release includes:

  - **Pre-compiled regex**: Path parameter regex is now extracted to module scope to avoid recompilation on every `path()` call, improving efficiency for path template processing
  - **Optimized string joining**: URL joining now uses direct string indexing instead of `endsWith`/`startsWith` methods, with fast paths for empty strings and common scenarios, reducing unnecessary string slicing
  - **Optimized parameter filtering**: The `removeNullOrUndef()` function now checks for null/undefined values before allocating new objects and uses direct property iteration instead of `Object.entries`/`Object.fromEntries`, resulting in faster execution and less memory usage

  For full details, see the [fast-url 6.0.2 release notes](https://github.com/hckhanh/fast-url/releases/tag/fast-url%406.0.2).

## 2.1.0

### Minor Changes

- a4bafdd: This release refactors the API schema typing and validation logic to improve type safety and flexibility for API requests and responses. The main changes include replacing the `ApiResponse` type with a more general `ApiData` type, updating validation utilities to support dynamic schema options, and enhancing request validation for parameterized paths.

  ### Type system improvements

  - Replaced the `ApiResponse` type with a new generic `ApiData` type, allowing extraction of any schema option (`'params'`, `'query'`, `'body'`, `'response'`) for a given API path. This change provides more flexible and accurate typing for API data throughout the codebase.
  - Updated all relevant type imports and exports to use `ApiData` instead of `ApiResponse`, and clarified type parameter names for better readability and maintainability. [[1]](diffhunk://#diff-a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80L33-R36) [[2]](diffhunk://#diff-39b2554fd18da165b59a6351b1aafff3714e2a80c1435f2de9706355b4d32351L8-R8) [[3]](diffhunk://#diff-c54113cf61ec99691748a3890bfbeb00e10efb3f0a76f03a0fd9ec49072e410aL41-R43)

  ### Validation logic improvements

  - Refactored the `validateData` utility to use the new `ApiData` type and accept dynamic schema options, improving reusability and type safety for validating different parts of an API request or response.
  - Added a new `validateRequestData` utility that validates `params`, `query`, and `body` for a given API path, and throws an error if a parameterized path lacks a corresponding `params` schema. This ensures runtime safety for parameterized API endpoints.

  ### API fetch function changes

  - Updated the `createFetch` function to use `validateRequestData` for validating request options and to return the correct `ApiData` type for responses. Also improved handling of request bodies to avoid sending `undefined` or `null` values. [[1]](diffhunk://#diff-a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80L88-R94) [[2]](diffhunk://#diff-a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80L106-R107)

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
