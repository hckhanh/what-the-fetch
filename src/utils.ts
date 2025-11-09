/**
 * Utility functions for what-the-fetch.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec'

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
