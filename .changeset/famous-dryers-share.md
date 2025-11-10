---
"what-the-fetch": patch
---

Simplify `StandardSchemaV1` type parameters across codebase and update related typings.

**Type Changes:**
- Simplified `StandardSchemaV1` usage from `StandardSchemaV1<T, unknown>` to `StandardSchemaV1<T>` throughout the codebase
- Updated `ApiSchema`, `FetchOptions`, and `ApiResponse` type definitions to use the simplified signature
- This change aligns with Standard Schema specification's usage patterns and improves type readability

**Files Updated:**
- `src/types.ts`: Simplified all `StandardSchemaV1` type parameters
- `test/createFetch.test.ts`: Updated test helper and assertions
- `docs/content/docs/api-reference.mdx`: Updated documentation examples
