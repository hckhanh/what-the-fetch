/**
 * Utility functions for what-the-fetch.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { ApiPath, ApiResponse, ApiSchema } from './types.ts'

/**
 * Validates data against a Standard Schema.
 *
 * Takes any data and validates it using the provided Standard Schema implementation.
 * If validation fails, throws an error with the validation issues.
 *
 * @param schema - A Standard Schema instance to validate against
 * @param data - The data to validate (can be any value)
 * @returns A promise that resolves to the validated data
 * @throws {Error} If validation fails, with validation issues in the error message
 *
 * @internal
 */
export async function validateData<
  T extends ApiSchema,
  Path extends ApiPath<T>,
>(
  apiSchema: T[Path],
  key: keyof T[Path],
  data: unknown,
): Promise<ApiResponse<T, Path>> {
  const schema = apiSchema[key] as
    | StandardSchemaV1<Record<string, unknown>>
    | undefined

  if (!schema) {
    return data as ApiResponse<T, Path>
  }

  const result = await schema['~standard'].validate(data)

  if (result.issues) {
    throw new Error(`Validation failed: ${JSON.stringify(result.issues)}`)
  }

  return result.value as ApiResponse<T, Path>
}
