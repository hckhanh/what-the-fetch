# what-the-fetch! [![NPM Downloads](https://img.shields.io/npm/dw/what-the-fetch)](https://www.npmjs.com/package/what-the-fetch) [![JSR](https://jsr.io/badges/@hckhanh/what-the-fetch/weekly-downloads)](https://jsr.io/@hckhanh/what-the-fetch)

Type-safe API client with schema validation using Standard Schema.

[![Test](https://github.com/hckhanh/what-the-fetch/actions/workflows/test.yml/badge.svg)](https://github.com/hckhanh/what-the-fetch/actions/workflows/test.yml)
[![codecov](https://codecov.io/github/hckhanh/what-the-fetch/graph/badge.svg?token=6W7S96H6OT)](https://codecov.io/github/hckhanh/what-the-fetch)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=hckhanh_what-the-fetch&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=hckhanh_what-the-fetch)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/what-the-fetch)](https://bundlephobia.com/result?p=what-the-fetch)
[![CodSpeed Badge](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/hckhanh/what-the-fetch?utm_source=badge)

what-the-fetch is a type-safe API client library that integrates schema validation with fetch requests, leveraging the Standard Schema specification for maximum flexibility and type safety.

## Features

- **Type-safe**: Full TypeScript support with end-to-end type inference
- **Schema validation**: Built-in support for Standard Schema (compatible with Zod, Valibot, ArkType, and more)
- **Flexible**: Works with any schema library that implements Standard Schema
- **Minimal**: Small bundle size with minimal dependencies
- **URL building**: Integrated with fast-url for clean URL construction

## Installation

```bash
# Using npm
npm install what-the-fetch

# Using bun
bun add what-the-fetch

# Using JSR (recommended for Deno)
deno add jsr:@hckhanh/what-the-fetch
```

## Usage

### Basic Example

```typescript
import { createFetch } from 'what-the-fetch';
import { z } from 'zod';

// Define your API schema
const api = {
  '/users/:id': {
    params: z.object({ id: z.number() }),
    query: z.object({ fields: z.string().optional() }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    }),
  },
  '/users': {
    query: z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
    }),
    response: z.array(z.object({
      id: z.number(),
      name: z.string(),
    })),
  },
} as const;

// Create a typed fetch function
const apiFetch = createFetch(api, 'https://api.example.com');

// Make type-safe requests
const user = await apiFetch('/users/:id', {
  params: { id: 123 },
  query: { fields: 'name,email' },
});
// user is typed as { id: number; name: string; email: string }

const users = await apiFetch('/users', {
  query: { limit: 10, offset: 0 },
});
// users is typed as Array<{ id: number; name: string }>
```

### With POST requests

```typescript
const api = {
  '/users': {
    body: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    }),
  },
} as const;

const apiFetch = createFetch(api, 'https://api.example.com');

const newUser = await apiFetch('/users', {
  body: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});
```

### With Shared Headers

You can provide shared headers when creating the fetch function:

```typescript
const apiFetch = createFetch(
  api,
  'https://api.example.com',
  {
    headers: {
      'Authorization': 'Bearer token',
    },
  }
);

// All requests will include the Authorization header
const user = await apiFetch('/users/:id', { params: { id: 123 } });
```

### With Per-Request Headers

You can also provide per-request headers that will be merged with shared headers:

```typescript
const apiFetch = createFetch(api, 'https://api.example.com');

const user = await apiFetch(
  '/users/:id',
  { params: { id: 123 } },
  {
    headers: {
      'Authorization': 'Bearer token',
      'X-Custom-Header': 'value',
    },
  }
);
```

## API

### `createFetch(schema, baseUrl, sharedInit?)`

Creates a type-safe fetch function for your API.

**Parameters:**
- `schema`: An object mapping API paths to their schema definitions
- `baseUrl`: The base URL for all API requests
- `sharedInit` (optional): Shared [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit) options that will be merged with per-request options

**Returns:** A typed fetch function that accepts:
- `path`: The API path (must be a key from your schema)
- `options` (optional): Request options (params, query, body) based on the path's schema
- `init` (optional): Per-request [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit) to customize the fetch request (merged with sharedInit)

### Schema Definition

Each path in your schema can have:

- `params`: Schema for URL path parameters (e.g., `:id`) - **Required** for parameterized paths
- `query`: Schema for query string parameters
- `body`: Schema for request body (automatically sets method to POST)
- `response`: Schema for response validation

All schemas must implement the Standard Schema specification.

**Note:** If your path contains parameters (e.g., `/users/:id`), you must define a `params` schema. The library will throw an error at runtime if you attempt to use a parameterized path without a params schema.

## Why what-the-fetch?

Building API clients manually is error-prone and lacks type safety:

```typescript
// ❌ No type safety, manual validation
const response = await fetch(`${baseUrl}/users/${id}?fields=${fields}`);
const data = await response.json();
// What type is data? Who knows!
```

```typescript
// ✅ Type-safe with validation
const user = await apiFetch('/users/:id', {
  params: { id },
  query: { fields },
});
// user is fully typed and validated!
```

what-the-fetch handles:

- Type-safe URL construction with path and query parameters
- Automatic request/response validation
- Clean separation of concerns
- Full TypeScript inference

## Standard Schema Support

what-the-fetch works with any schema library that implements [Standard Schema](https://standardschema.dev/):

- [Zod](https://zod.dev/)
- [Valibot](https://valibot.dev/)
- [ArkType](https://arktype.io/)
- [TypeSchema](https://typeschema.com/)
- And more!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
