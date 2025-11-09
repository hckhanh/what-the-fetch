/**
 * Type definitions for the what-the-fetch API client.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec'

/**
 * Schema definition for an API endpoint.
 *
 * Maps API paths to their schema definitions, including optional schemas for
 * path parameters, query parameters, request body, and response.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const api: ApiSchema = {
 *   '/users/:id': {
 *     params: z.object({ id: z.number() }),
 *     query: z.object({ fields: z.string().optional() }),
 *     response: z.object({ id: z.number(), name: z.string() })
 *   }
 * };
 * ```
 */
export type ApiSchema = Record<
  string,
  {
    params?: StandardSchemaV1<Record<string, unknown>, unknown>
    query?: StandardSchemaV1<Record<string, unknown>, unknown>
    body?: StandardSchemaV1<Record<string, unknown>, unknown>
    response?: StandardSchemaV1<Record<string, unknown>, unknown>
  }
>

/**
 * Extract valid API paths from an API schema.
 *
 * @template T - The API schema type
 */
export type ApiPath<T extends ApiSchema> = keyof T & string

/**
 * Extract the required fetch options for a specific API path.
 *
 * Automatically infers the correct types for params, query, and body based on
 * the schema definition for the given path.
 *
 * @template T - The API schema type
 * @template Path - The specific API path
 */
export type FetchOptions<
  T extends ApiSchema,
  Path extends ApiPath<T>,
> = T[Path] extends infer Schema
  ? Schema extends {
      params?: infer P
      query?: infer Q
      body?: infer B
    }
    ? (P extends StandardSchemaV1<infer Params, unknown>
        ? { params: Params }
        : {}) &
        (Q extends StandardSchemaV1<infer Query, unknown>
          ? { query: Query }
          : {}) &
        (B extends StandardSchemaV1<infer Body, unknown> ? { body?: Body } : {})
    : never
  : never

/**
 * Extract the response type for a specific API path.
 *
 * Infers the correct return type based on the response schema definition.
 *
 * @template T - The API schema type
 * @template Path - The specific API path
 */
export type ApiResponse<
  T extends ApiSchema,
  Path extends ApiPath<T>,
> = T[Path] extends infer Schema
  ? Schema extends { response: infer R }
    ? R extends StandardSchemaV1<infer Response, unknown>
      ? Response
      : unknown
    : unknown
  : unknown
