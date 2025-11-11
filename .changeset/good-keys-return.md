---
"what-the-fetch": minor
---

This release refactors the API schema typing and validation logic to improve type safety and flexibility for API requests and responses. The main changes include replacing the `ApiResponse` type with a more general `ApiData` type, updating validation utilities to support dynamic schema options, and enhancing request validation for parameterized paths.

### Type system improvements

* Replaced the `ApiResponse` type with a new generic `ApiData` type, allowing extraction of any schema option (`'params'`, `'query'`, `'body'`, `'response'`) for a given API path. This change provides more flexible and accurate typing for API data throughout the codebase.
* Updated all relevant type imports and exports to use `ApiData` instead of `ApiResponse`, and clarified type parameter names for better readability and maintainability. [[1]](diffhunk://#diff-a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80L33-R36) [[2]](diffhunk://#diff-39b2554fd18da165b59a6351b1aafff3714e2a80c1435f2de9706355b4d32351L8-R8) [[3]](diffhunk://#diff-c54113cf61ec99691748a3890bfbeb00e10efb3f0a76f03a0fd9ec49072e410aL41-R43)

### Validation logic improvements

* Refactored the `validateData` utility to use the new `ApiData` type and accept dynamic schema options, improving reusability and type safety for validating different parts of an API request or response.
* Added a new `validateRequestData` utility that validates `params`, `query`, and `body` for a given API path, and throws an error if a parameterized path lacks a corresponding `params` schema. This ensures runtime safety for parameterized API endpoints.

### API fetch function changes

* Updated the `createFetch` function to use `validateRequestData` for validating request options and to return the correct `ApiData` type for responses. Also improved handling of request bodies to avoid sending `undefined` or `null` values. [[1]](diffhunk://#diff-a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80L88-R94) [[2]](diffhunk://#diff-a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80L106-R107)
