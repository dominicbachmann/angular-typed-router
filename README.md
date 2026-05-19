# Angular Typed Router

Type-safe navigation for Angular. One source of truth (your `Routes` array) → inferred `Path` union + strongly typed `navigate` command tuples. No codegen, no runtime cost, just TypeScript. ✨

## Why
- ✅ Catch broken / misspelled route paths at compile time
- 🛠️ Refactors become safer (remove a route → instant red squiggles)
- ⚡ Zero runtime weight (pure types)
- 🔁 Works exactly the same as Angular Router except you now import `TypedRouter` instead of `Router` and use `TypedRouterLink` instead of `RouterLink` (and you get type safety)
- 🔌 Drop-in: keep your existing routing setup

## Features
- 📍 `Path` – union of every concrete reachable URL
- 🧩 `Commands` – typed tuples for `router.navigate([...])`
- 💡 Get auto-completion for paths and commands
- 🚀 `TypedRouter` – typed `navigate` / `navigateByUrl` / `createUrlTree`
- 🔗 `TypedRouterLink` – typed `[routerLink]` in templates
- 🪄 It's all zero-runtime-weight types and interfaces, no code generation, no decorators, no custom builders

## Installation 📦

Installation guide: [libs/typed-router/README.md](./libs/typed-router/README.md).
