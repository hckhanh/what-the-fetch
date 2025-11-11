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
 *   '@get/users/:id': {
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
 * const user = await apiFetch('@get/users/:id', { params: { id: 123 } });
 * ```
 */

import { createUrl } from 'fast-url'
import type { ApiData, ApiPath, ApiSchema, FetchOptions } from './types.ts'
import {
  parseMethodFromPath,
  validateData,
  validateRequestData,
} from './utils.ts'

export type { ApiData, ApiPath, ApiSchema, FetchOptions } from './types.ts'

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
 *   '@get/users/:id': {
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
 * const user = await apiFetch('@get/users/:id', {
 *   params: { id: 123 },
 *   query: { fields: 'name,email' }
 * });
 * ```
 */
export function createFetch<Schema extends ApiSchema>(
  apis: Schema,
  baseUrl: string,
  sharedInit?: Omit<RequestInit, 'method'>,
): <Path extends ApiPath<Schema>>(
  path: Path,
  options?: FetchOptions<Schema, Path>,
  init?: Omit<RequestInit, 'method'>,
) => Promise<ApiData<Schema, Path, 'response'>> {
  return async (path, options, init?: Omit<RequestInit, 'method'>) => {
    const [params, query, body] = await validateRequestData(
      apis[path],
      path,
      options,
    )

    // Parse method from path (e.g., '@get/users' -> 'GET', '/users')
    const [method, cleanPath] = parseMethodFromPath(path)

    // Determine the method: use prefix if available, otherwise POST if body exists, otherwise GET
    const httpMethod =
      method || (body !== undefined && body !== null ? 'POST' : 'GET')

    // Prepare fetch options with method and headers
    const requestInit: RequestInit = {
      ...sharedInit,
      ...init,
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        ...sharedInit?.headers,
        ...init?.headers,
      },
    }

    if (body !== undefined && body !== null) {
      requestInit.body = JSON.stringify(body)
    }

    // Build URL with params and query using clean path
    const url = createUrl(baseUrl, cleanPath, {
      ...(params as Record<string, unknown> | undefined),
      ...(query as Record<string, unknown> | undefined),
    })

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
