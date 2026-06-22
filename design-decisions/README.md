# Design Decisions

Long-form rationale for Routewise design choices. Each file captures **what we considered**, **what we picked**, and **why** — so we don't relitigate the same questions later.

Use this folder for:

- Architectural decisions (routing, middleware, compiler, runtime)
- Convention choices (file naming, exports, folder structure)
- Trade-offs deliberately accepted or deferred
- Dev documentation as the framework grows

## Index

| # | Decision | Status |
| --- | --- | --- |
| 001 | [Middleware model](./001-middleware.md) | Implemented |
| 002 | [File-based routing](./002-file-based-routing.md) | Implemented |
| 003 | [Compiler pipeline](./003-compiler-pipeline.md) | Implemented |
| 004 | [Router & matcher](./004-router-matcher.md) | Implemented |
| 005 | [Context object (`ctx`)](./005-context-object.md) | Implemented (partial) |
| 006 | [Server runtime](./006-server-runtime.md) | Implemented |
| 007 | [Package structure & example app](./007-package-structure.md) | Implemented |

## Status legend

| Status | Meaning |
| --- | --- |
| Implemented | Shipped in `src/` and verified against the example app |
| Implemented (partial) | Shipped but with known gaps captured in the doc's "deferred" section |
| Proposed | Design agreed, code change not yet started |
| Draft | Still under discussion |
