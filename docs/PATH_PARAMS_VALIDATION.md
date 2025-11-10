# Path Parameters Type Validation

## Overview

The library now provides type-level validation to ensure that `params` schemas match the path parameters in your API routes. This prevents common mistakes where parameter names in the schema don't match the path template.

## Problem

Previously, you could define an API with mismatched parameter names:

```typescript
const api = {
  '/users/:id': {
    params: z.object({ userId: z.number() }), // ❌ 'userId' doesn't match ':id'
    response: z.object({ id: z.number(), name: z.string() })
  }
}
```

This would compile without errors, but fail at runtime when the URL builder couldn't find the `id` parameter.

## Solution

The library now includes TypeScript type-level validation that:

1. **Extracts parameter names** from path templates (e.g., `:id`, `:userId`, `:postId`)
2. **Validates schema keys** to ensure they exactly match the extracted parameter names
3. **Shows compile-time errors** when there's a mismatch

## Usage

### Valid Examples

```typescript
import { createFetch } from 'what-the-fetch';
import { z } from 'zod';

// ✅ Single parameter - correct
const api1 = {
  '/users/:id': {
    params: z.object({ id: z.number() }),
    response: z.object({ id: z.number(), name: z.string() })
  }
};

// ✅ Multiple parameters - correct
const api2 = {
  '/users/:userId/posts/:postId': {
    params: z.object({ 
      userId: z.number(), 
      postId: z.number() 
    }),
    response: z.object({ title: z.string() })
  }
};

// ✅ No parameters - params can be omitted
const api3 = {
  '/users': {
    query: z.object({ limit: z.number() }),
    response: z.object({ users: z.array(z.any()) })
  }
};
```

### Invalid Examples (Will Show Type Errors)

```typescript
// ❌ Mismatched param name
const badApi1 = {
  '/users/:id': {
    params: z.object({ userId: z.number() }), // Type error!
    response: z.object({ id: z.number(), name: z.string() })
  }
};

// ❌ Missing param
const badApi2 = {
  '/users/:userId/posts/:postId': {
    params: z.object({ userId: z.number() }), // Type error: missing 'postId'
    response: z.object({ title: z.string() })
  }
};

// ❌ Extra param not in path
const badApi3 = {
  '/users/:id': {
    params: z.object({ 
      id: z.number(), 
      extra: z.string() // Type error: 'extra' not in path
    }),
    response: z.object({ id: z.number(), name: z.string() })
  }
};

// ❌ Path has params but schema is missing
const badApi4 = {
  '/users/:id': {
    // Type error: missing params schema
    response: z.object({ id: z.number(), name: z.string() })
  }
};
```

## ExtractPathParams Utility Type

The library exports an `ExtractPathParams` type that you can use to extract parameter names from a path string:

```typescript
import type { ExtractPathParams } from 'what-the-fetch';

// Extract single parameter
type UserIdParam = ExtractPathParams<'/users/:id'>;
// Result: 'id'

// Extract multiple parameters
type MultipleParams = ExtractPathParams<'/users/:userId/posts/:postId'>;
// Result: 'userId' | 'postId'

// No parameters
type NoParams = ExtractPathParams<'/users'>;
// Result: never
```

## How It Works

The validation uses TypeScript's template literal types to:

1. **Parse the path string** to find all `:paramName` patterns
2. **Extract parameter names** as a union type
3. **Compare** the schema keys with the extracted parameter names
4. **Generate error types** when there's a mismatch

The validation happens entirely at compile-time with zero runtime overhead.

## Benefits

- **Catch errors early**: TypeScript will show errors immediately in your IDE
- **Better refactoring**: Renaming path parameters will automatically highlight mismatches
- **Self-documenting**: The types clearly show what parameters are expected
- **Zero runtime cost**: All validation happens at compile-time

## Migration

This change is **backward compatible**. Existing code that already has matching parameter names will continue to work without modification. Only code with actual mismatches will show type errors, which indicates real bugs that should be fixed.

## Alternative Approaches Considered

### 1. **Current Implementation: Type-Level Validation Only**

**Pros:**
- Zero runtime overhead
- Immediate feedback in IDE
- Backward compatible for correct code
- Works with all schema libraries

**Cons:**
- Requires TypeScript
- Type errors can be complex for users unfamiliar with advanced TypeScript

### 2. **Runtime Validation**

We could add runtime checks to validate params against the path:

```typescript
// At runtime, check if params match path
if (hasPathParams(path)) {
  const requiredParams = extractParamsFromPath(path);
  const providedParams = Object.keys(params);
  if (!arraysMatch(requiredParams, providedParams)) {
    throw new Error(`Params mismatch: expected ${requiredParams}, got ${providedParams}`);
  }
}
```

**Pros:**
- Works without TypeScript
- Clear error messages at runtime

**Cons:**
- Runtime overhead on every request
- Errors only caught when code runs
- Adds bundle size

### 3. **Compile-Time Validation with Build Plugin**

Use a build tool plugin to validate schemas:

**Pros:**
- Can provide better error messages
- Could work across different schema libraries

**Cons:**
- Requires build tool integration
- More complex setup
- Not available in all environments

### 4. **Strict Template Literal Types**

Make the path a template literal type that enforces structure:

```typescript
type PathWithParams<T extends string> = T extends `${infer _}:${infer _}` ? T : never;
```

**Pros:**
- Very strict typing
- Clear intent

**Cons:**
- More verbose API
- Harder to use
- Would be a breaking change

## Decision

We chose **Type-Level Validation Only** (approach #1) because:

1. It provides immediate feedback without runtime cost
2. It's backward compatible
3. It works seamlessly with all Standard Schema libraries
4. It aligns with TypeScript best practices
5. It's the most lightweight solution

For users who prefer runtime validation, they can add their own validation layer on top.
