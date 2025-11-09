# what-the-fetch

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
