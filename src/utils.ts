/**
 * Utility functions for what-the-fetch.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { ApiData, ApiPath, ApiSchema } from './types.ts'

/**
 * Validates data against a Standard Schema from an API path schema.
 *
 * Takes an API path schema object, extracts the specified schema (e.g., 'response', 'params'),
 * and validates the provided data against it. If validation fails, throws an error with the
 * validation issues.
 *
 * @template Schemas - The API schema type
 * @template Path - The specific API path
 * @param apiSchema - The complete schema object for a specific API path
 * @param option - The key of the schema to validate against (e.g., 'response', 'params', 'query', 'body')
 * @param data - The data to validate (can be any value)
 * @returns A promise that resolves to the validated data
 * @throws {Error} If validation fails, with validation issues in the error message
 *
 * @internal
 */
export async function validateData<
  Schemas extends ApiSchema,
  Path extends ApiPath<Schemas>,
  Option extends keyof Schemas[Path],
>(
  apiSchema: Schemas[Path],
  option: Option,
  data: unknown,
): Promise<ApiData<Schemas, Path, Option>> {
  const schema = apiSchema[option] as
    | StandardSchemaV1<Record<string, unknown>>
    | undefined

  if (!schema) {
    return data as ApiData<Schemas, Path, Option>
  }

  const result = await schema['~standard'].validate(data)

  if (result.issues) {
    throw new Error(`Validation failed: ${JSON.stringify(result.issues)}`)
  }

  return result.value as ApiData<Schemas, Path, Option>
}

const PARAMS_REGEX = /\/:\w+/
const METHOD_PREFIX_REGEX = /^@(\w+)(\/.*)?$/

/**
 * Parses the HTTP method and clean path from a path string.
 *
 * Supports method prefix notation like `@get/api` or `@post/api/:id`.
 * If no method prefix is provided, returns undefined for method.
 *
 * @param path - The API path string, optionally with method prefix (e.g., '@get/users' or '/users')
 * @returns A tuple of [method, cleanPath] where method is uppercase or undefined, and cleanPath is the path without prefix
 *
 * @example
 * ```typescript
 * parseMethodFromPath('@get/users') // ['GET', '/users']
 * parseMethodFromPath('@post/users/:id') // ['POST', '/users/:id']
 * parseMethodFromPath('/users') // [undefined, '/users']
 * ```
 *
 * @internal
 */
export function parseMethodFromPath(
  path: string,
): [string | undefined, string] {
  const match = METHOD_PREFIX_REGEX.exec(path)
  return match ? [match[1].toUpperCase(), match[2] || '/'] : [undefined, path]
}

/**
 * Validates request data (params, query, body) for an API path.
 *
 * Checks that parameterized paths have a corresponding params schema defined,
 * and validates all provided request data against the API schema.
 *
 * @template Schemas - The API schema type
 * @template Path - The specific API path
 * @param apiSchema - The schema definition for the API path
 * @param path - The API path string (may contain parameters like /users/:id)
 * @param options - Optional request data containing params, query, and/or body
 * @returns A promise resolving to an array with validated [params, query, body]
 * @throws {Error} If the path contains parameters but no params schema is defined
 *
 * @internal
 */
export async function validateRequestData<
  Schemas extends ApiSchema,
  Path extends ApiPath<Schemas>,
>(
  apiSchema: Schemas[Path],
  path: Path,
  options: Partial<Record<keyof Schemas[Path], unknown>> | undefined,
) {
  // Extract clean path without method prefix for validation
  const [, cleanPath] = parseMethodFromPath(path)

  if (PARAMS_REGEX.test(cleanPath) && !apiSchema.params) {
    throw new Error(
      'Path contains parameters but no "params" schema is defined.',
    )
  }

  return Promise.all([
    validateData<Schemas, Path, 'params'>(apiSchema, 'params', options?.params),
    validateData<Schemas, Path, 'query'>(apiSchema, 'query', options?.query),
    validateData<Schemas, Path, 'body'>(apiSchema, 'body', options?.body),
  ])
}
