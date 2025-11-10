/**
 * This file demonstrates the path parameter type validation.
 * It contains examples of both valid and invalid API schemas.
 *
 * Valid examples will compile without errors.
 * Invalid examples are commented out and show what errors would occur.
 */

import { z } from 'zod'
import type { ApiSchema, ExtractPathParams } from '../src'

// ============================================================================
// ExtractPathParams Type Examples
// ============================================================================

// Single parameter
type SingleParam = ExtractPathParams<'/users/:id'> // 'id'

// Multiple parameters
type MultipleParams = ExtractPathParams<'/users/:userId/posts/:postId'> // 'userId' | 'postId'

// No parameters
type NoParams = ExtractPathParams<'/users'> // never

// Complex path
type ComplexPath =
  ExtractPathParams<'/api/v1/org/:orgId/team/:teamId/member/:memberId'> // 'orgId' | 'teamId' | 'memberId'

// ============================================================================
// Valid API Schema Examples
// ============================================================================

// ✅ Single parameter - correct
const validApi1: ApiSchema = {
  '/users/:id': {
    params: z.object({ id: z.number() }),
    response: z.object({ id: z.number(), name: z.string() }),
  },
}

// ✅ Multiple parameters - correct
const validApi2: ApiSchema = {
  '/users/:userId/posts/:postId': {
    params: z.object({ userId: z.number(), postId: z.number() }),
    response: z.object({ title: z.string() }),
  },
}

// ✅ No parameters - no params schema needed
const validApi3: ApiSchema = {
  '/users': {
    response: z.object({
      users: z.array(z.object({ id: z.number(), name: z.string() })),
    }),
  },
}

// ✅ No parameters - params can be omitted
const validApi4: ApiSchema = {
  '/users': {
    query: z.object({ limit: z.number().optional() }),
    response: z.object({
      users: z.array(z.object({ id: z.number(), name: z.string() })),
    }),
  },
}

// ✅ Complex path with many parameters
const validApi5: ApiSchema = {
  '/org/:orgId/team/:teamId/member/:memberId': {
    params: z.object({
      orgId: z.string(),
      teamId: z.string(),
      memberId: z.string(),
    }),
    response: z.object({ name: z.string() }),
  },
}

// ============================================================================
// Invalid API Schema Examples (Commented Out - Would Cause Type Errors)
// ============================================================================

// ❌ Mismatched param name
// const invalidApi1: ApiSchema = {
//   '/users/:id': {
//     params: z.object({ userId: z.number() }), // Type error: 'userId' != 'id'
//     response: z.object({ id: z.number(), name: z.string() }),
//   },
// }

// ❌ Missing param
// const invalidApi2: ApiSchema = {
//   '/users/:userId/posts/:postId': {
//     params: z.object({ userId: z.number() }), // Type error: missing 'postId'
//     response: z.object({ title: z.string() }),
//   },
// }

// ❌ Extra param not in path
// const invalidApi3: ApiSchema = {
//   '/users/:id': {
//     params: z.object({ id: z.number(), extra: z.string() }), // Type error: 'extra' not in path
//     response: z.object({ id: z.number(), name: z.string() }),
//   },
// }

// ❌ Path has params but schema is missing
// const invalidApi4: ApiSchema = {
//   '/users/:id': {
//     // Type error: path has ':id' but params schema is missing
//     response: z.object({ id: z.number(), name: z.string() }),
//   },
// }

// ❌ Completely wrong param names
// const invalidApi5: ApiSchema = {
//   '/users/:userId/posts/:postId': {
//     params: z.object({ id: z.number(), post: z.number() }), // Type error: neither match
//     response: z.object({ title: z.string() }),
//   },
// }

// Suppress unused variable warnings
export {
  validApi1,
  validApi2,
  validApi3,
  validApi4,
  validApi5,
  // Type assertions to verify the types are what we expect
  type ComplexPath,
  type MultipleParams,
  type NoParams,
  type SingleParam,
}
