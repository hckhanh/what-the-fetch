/**
 * Utility functions for what-the-fetch.
 *
 * @module
 */

import type { ApiPath, ApiResponse, ApiSchema } from './types.ts'

/**
 * Validates response data against a schema.
 *
 * If a response schema is defined, validates the data using Standard Schema.
 * Throws an error if validation fails.
 *
 * @template T - The API schema type
 * @template Path - The specific API path
 * @param schema - The schema definition for the path
 * @param data - The response data to validate
 * @returns The validated response data
 * @throws {Error} If validation fails
 *
 * @internal
 */
export async function validateResponse<
  T extends ApiSchema,
  Path extends ApiPath<T>,
>(schema: T[Path], data: unknown): Promise<ApiResponse<T, Path>> {
  if (schema.response) {
    const result = await schema.response['~standard'].validate(data)

    if (result.issues) {
      throw new Error(`Validation failed: ${JSON.stringify(result.issues)}`)
    }

    return result.value as ApiResponse<T, Path>
  }

  return data as ApiResponse<T, Path>
}
