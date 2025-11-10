/**
 * Type definitions for the what-the-fetch API client.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec'

/**
 * Extract path parameter names from a path template string.
 *
 * Extracts all `:paramName` patterns from a path string and returns them as a union.
 *
 * @template Path - The path template string
 *
 * @example
 * ```typescript
 * type Params1 = ExtractPathParams<'/users/:id'>
 * // => 'id'
 *
 * type Params2 = ExtractPathParams<'/users/:userId/posts/:postId'>
 * // => 'userId' | 'postId'
 *
 * type Params3 = ExtractPathParams<'/users'>
 * // => never
 * ```
 */
export type ExtractPathParams<Path extends string> =
  Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : Path extends `${infer _Start}:${infer Param}`
      ? Param
      : never

/**
 * Schema definition for an API endpoint.
 *
 * Maps API paths to their schema definitions, including optional schemas for
 * path parameters, query parameters, request body, and response.
 *
 * The `params` schema keys must exactly match the path parameter names in the path string.
 * For example, if the path is `/users/:id`, the params schema must have an `id` key.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * // ✅ Correct: params schema matches path parameters
 * const api: ApiSchema = {
 *   '/users/:id': {
 *     params: z.object({ id: z.number() }),
 *     query: z.object({ fields: z.string().optional() }),
 *     response: z.object({ id: z.number(), name: z.string() })
 *   }
 * };
 *
 * // ❌ Error: params schema key 'userId' does not match path parameter 'id'
 * const badApi: ApiSchema = {
 *   '/users/:id': {
 *     params: z.object({ userId: z.number() }), // Type error!
 *     response: z.object({ id: z.number(), name: z.string() })
 *   }
 * };
 * ```
 */
export type ApiSchema = {
  [Path in string]: ExtractPathParams<Path> extends never
    ? {
        // No params in path - params is optional
        params?: StandardSchemaV1<Record<string, unknown>>
        query?: StandardSchemaV1<Record<string, unknown>>
        body?: StandardSchemaV1<Record<string, unknown>>
        response?: StandardSchemaV1<Record<string, unknown>>
      }
    : {
        // Has params in path - params is REQUIRED and must be a StandardSchemaV1 matching the path params
        params: StandardSchemaV1<Record<ExtractPathParams<Path>, unknown>>
        query?: StandardSchemaV1<Record<string, unknown>>
        body?: StandardSchemaV1<Record<string, unknown>>
        response?: StandardSchemaV1<Record<string, unknown>>
      }
}

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
    ? (P extends StandardSchemaV1<infer Params> ? { params: Params } : {}) &
        (Q extends StandardSchemaV1<infer Query> ? { query: Query } : {}) &
        (B extends StandardSchemaV1<infer Body> ? { body: Body } : {})
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
    ? R extends StandardSchemaV1<infer Response>
      ? Response
      : unknown
    : unknown
  : unknown
