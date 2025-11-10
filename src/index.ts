/**
 * @module
 *
 * Type-safe API client with schema validation using Standard Schema.
 *
 * This module provides a way to create type-safe fetch functions with automatic
 * schema validation for API requests and responses.
 *
 * @example
 * ```typescript
 * import { createFetch } from '@hckhanh/what-the-fetch';
 * import { z } from 'zod';
 *
 * const api = {
 *   '/users/:id': {
 *     params: z.object({ id: z.number() }),
 *     response: z.object({ id: z.number(), name: z.string() })
 *   }
 * };
 *
 * // Create fetch with optional shared headers
 * const apiFetch = createFetch(
 *   api,
 *   'https://api.example.com',
 *   { headers: { 'Authorization': 'Bearer token' } }
 * );
 *
 * const user = await apiFetch('/users/:id', { params: { id: 123 } });
 * ```
 */

import { createUrl } from 'fast-url'
import type { ApiPath, ApiResponse, ApiSchema, FetchOptions } from './types.ts'
import { validateData } from './utils.ts'

export type { ApiPath, ApiResponse, ApiSchema, FetchOptions } from './types.ts'

/**
 * Creates a type-safe fetch function for your API.
 *
 * This function takes an API schema definition and a base URL, returning a
 * typed fetch function that validates requests and responses according to
 * the provided schemas.
 *
 * @template Schema - The API schema definition mapping paths to their schemas
 * @param apis - An object mapping API paths to their schema definitions
 * @param baseUrl - The base URL for all API requests
 * @param sharedInit - Optional shared {@link RequestInit} options that will be merged with per-request options
 * @returns A typed fetch function that accepts path, optional options, and optional per-request {@link RequestInit}
 *
 * @example
 * ```typescript
 * import { createFetch } from '@hckhanh/what-the-fetch';
 * import { z } from 'zod';
 *
 * const api = {
 *   '/users/:id': {
 *     params: z.object({ id: z.number() }),
 *     query: z.object({ fields: z.string().optional() }),
 *     response: z.object({ id: z.number(), name: z.string() })
 *   }
 * };
 *
 * // Create fetch with shared headers
 * const apiFetch = createFetch(
 *   api,
 *   'https://api.example.com',
 *   {
 *     headers: { 'Authorization': 'Bearer token' }
 *   }
 * );
 *
 * // Type-safe request with validation
 * const user = await apiFetch('/users/:id', {
 *   params: { id: 123 },
 *   query: { fields: 'name,email' }
 * });
 * ```
 */
export function createFetch<Schema extends ApiSchema>(
  apis: Schema,
  baseUrl: string,
  sharedInit?: RequestInit,
): <Path extends ApiPath<Schema>>(
  path: Path,
  options?: FetchOptions<Schema, Path>,
  init?: RequestInit,
) => Promise<ApiResponse<Schema, Path>> {
  return async (path, options, init?: RequestInit) => {
    const { params, query, body } = (options ?? {}) as Record<
      'params' | 'query' | 'body',
      Record<string, unknown>
    >

    // Prepare fetch options with default method and headers
    const requestInit: RequestInit = {
      ...sharedInit,
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...sharedInit?.headers,
        ...init?.headers,
      },
    }

    if (body) {
      requestInit.body = JSON.stringify(body)
    }

    // Build URL with params and query
    const url = createUrl(baseUrl, path, { ...params, ...query })

    // Make request
    const response = await fetch(url, requestInit)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`, {
        cause: response,
      })
    }

    // Get response data
    const data = await response.json()

    return validateData(apis[path], 'response', data)
  }
}
