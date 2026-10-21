# Performance benchmarks

The maintained suite is `benchmarks/fetch.bench.ts`.
The maintained suite separates reused clients from client construction, synchronous
and asynchronous validators, and method-prefix parsing. Fetch uses a deterministic
in-memory response without spy call recording; no network latency is measured.
Client and schema setup happens outside timing, except in the explicitly named
client-construction case. The older `benchmark/` suite remains diagnostic material.

## Matching vn-number's CodSpeed toolchain

- Node 24.21.0 and Vitest 5.0.4.
- `@codspeed/vitest-plugin` 6.1.0, supporting Node 24 and Vitest 5.
- Vite 8.3.4.
- CodSpeed action 5.5.0 with runner **5.5.0**, cycle estimation enabled, and
  allocation costs included.

Vitest 5 benchmarks use the `bench` fixture inside an async `test`, awaiting
each `bench(name, callback).run()`. Preserve test and workload names to retain
the existing CodSpeed benchmark IDs. Install the fetch stub in `beforeEach`
because `unstubGlobals` clears module-level stubs before each test.

CodSpeed 6.1.0 disables Vitest 5's diagnostic export-getter tracking by default.
Results relative to 6.0.0 and 6.0.1 reflect a measurement correction, not a
production-library speedup. See the
[6.1.0 release notes](https://github.com/CodSpeedHQ/codspeed-node/releases/tag/v6.1.0).

Routine CI measures simulation on Ubuntu 24.04, matching vn-number.
Manual dispatch and reusable workflow calls can explicitly select walltime or
both instruments. Use matching hardware for walltime comparisons; shared hosted
runners can introduce timing noise.
Run locally only through an authenticated CodSpeed CLI:

```sh
codspeed run -m simulation -- bun run bench
codspeed run -m walltime -- bun run bench
```

Runner 5 scores are not comparable with the previous runner 4 results. The
migration commit establishes a fresh baseline with unchanged production source.
Compare only matching benchmark URIs, input values, batch sizes, dependency
versions, Node versions and instrument settings. Check CPU metadata and variance
before accepting walltime changes from hosted runners. A NEW/SKIPPED-only report
is not evidence of a speed improvement.

Keep fixture creation outside timing unless it is the stated workload. Do not
change the harness between baseline and candidate measurements. Retain a change
only after correctness tests pass and CodSpeed walltime confirms the benefit.
Benchmark tooling is excluded from published packages.
