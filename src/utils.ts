/**
 * Utility functions for what-the-fetch.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec'

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
export async function validateData(
  schema: StandardSchemaV1<Record<string, unknown>>,
  data: unknown,
): Promise<Record<string, unknown>> {
  const result = await schema['~standard'].validate(data)

  if (result.issues) {
    throw new Error(`Validation failed: ${JSON.stringify(result.issues)}`)
  }

  return result.value
}
