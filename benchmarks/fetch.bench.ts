import type { StandardSchemaV1 } from '@standard-schema/spec'
import { afterAll, bench, describe, expect, vi } from 'vitest'
import { createFetch } from '../src/index.ts'
import { parseMethodFromPath } from '../src/utils.ts'

const responseData = { id: 123, name: 'Test' }
const response = { ok: true, json: async () => responseData }
// Exclude the network and spy bookkeeping: measure request construction and validation.
vi.stubGlobal('fetch', async () => response)

function schema<T>(): StandardSchemaV1<T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'benchmark',
      validate: (value) => ({ value: value as T }),
    },
  }
}

const asyncResponse: StandardSchemaV1<typeof responseData> = {
  '~standard': {
    version: 1,
    vendor: 'benchmark',
    validate: async (value) => ({ value: value as typeof responseData }),
  },
}
const api = {
  '/users': {},
  '@get/users': { response: schema<typeof responseData>() },
  '@get/async': { response: asyncResponse },
  '@get/users/:id': {
    params: schema<{ id: number }>(),
    query: schema<{ fields: string }>(),
    response: schema<typeof responseData>(),
  },
  '@post/users': {
    body: schema<{ name: string }>(),
    response: schema<typeof responseData>(),
  },
}
const client = createFetch(api, 'https://api.example.com')
const sharedClient = createFetch(api, 'https://api.example.com', {
  headers: { Authorization: 'Bearer benchmark' },
})
const options = { params: { id: 123 }, query: { fields: 'name,email' } }
const postOptions = { body: { name: 'Test' } }
const paths = ['/users', '@get/users', '@post/users', '@GeT/users/:id', '@get']
let consumed = 0

describe('fetch workloads', () => {
  bench('GET without validation', async () => {
    consumed += Number((await client('/users')) !== undefined)
  })
  bench('GET with synchronous response validation', async () => {
    consumed += (await client('@get/users')).id
  })
  bench('GET with asynchronous response validation', async () => {
    consumed += (await client('@get/async')).id
  })
  bench('GET with params and query validation', async () => {
    consumed += (await client('@get/users/:id', options)).id
  })
  bench('GET with shared headers', async () => {
    consumed += (await sharedClient('@get/users/:id', options)).id
  })
  bench('POST with body validation', async () => {
    consumed += (await client('@post/users', postOptions)).id
  })
  bench('create client and request', async () => {
    const freshClient = createFetch(api, 'https://api.example.com')
    consumed += (await freshClient('@get/users')).id
  })
  bench('parse five method prefixes', () => {
    for (const path of paths) {
      consumed += parseMethodFromPath(path)[1].length
    }
  })
})

afterAll(() => {
  expect(consumed).toBeGreaterThan(0)
  vi.unstubAllGlobals()
})
