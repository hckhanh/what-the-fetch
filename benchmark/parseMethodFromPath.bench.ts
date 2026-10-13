import { test } from 'vitest'
import { parseMethodFromPath } from '../src/utils'

test('parseMethodFromPath benchmarks', { timeout: 120_000 }, async ({
  bench,
}) => {
  await bench('parse @get prefix', () => {
    parseMethodFromPath('@get/users')
  }).run()

  await bench('parse @post prefix', () => {
    parseMethodFromPath('@post/users')
  }).run()

  await bench('parse @put prefix with params', () => {
    parseMethodFromPath('@put/users/:id')
  }).run()

  await bench('parse @delete prefix', () => {
    parseMethodFromPath('@delete/users/:id')
  }).run()

  await bench('parse @patch prefix', () => {
    parseMethodFromPath('@patch/users/:id')
  }).run()

  await bench('parse path without prefix', () => {
    parseMethodFromPath('/users')
  }).run()

  await bench('parse path without prefix with params', () => {
    parseMethodFromPath('/users/:id/posts/:postId')
  }).run()

  await bench('parse @get without path', () => {
    parseMethodFromPath('@get')
  }).run()

  await bench('parse case-insensitive @GeT prefix', () => {
    parseMethodFromPath('@GeT/users')
  }).run()

  await bench('parse complex path with @post prefix', () => {
    parseMethodFromPath('@post/api/v1/users/:userId/posts/:postId/comments')
  }).run()
})
