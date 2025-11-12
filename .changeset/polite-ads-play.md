---
"what-the-fetch": patch
---

Update `fast-url` dependency to version 6.0.2 for significant performance optimizations. This release includes:

- **Pre-compiled regex**: Path parameter regex is now extracted to module scope to avoid recompilation on every `path()` call, improving efficiency for path template processing
- **Optimized string joining**: URL joining now uses direct string indexing instead of `endsWith`/`startsWith` methods, with fast paths for empty strings and common scenarios, reducing unnecessary string slicing
- **Optimized parameter filtering**: The `removeNullOrUndef()` function now checks for null/undefined values before allocating new objects and uses direct property iteration instead of `Object.entries`/`Object.fromEntries`, resulting in faster execution and less memory usage

For full details, see the [fast-url 6.0.2 release notes](https://github.com/hckhanh/fast-url/releases/tag/fast-url%406.0.2).
