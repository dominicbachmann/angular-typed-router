# Typed-router type-chain readability refactor

**Status:** approved
**Date:** 2026-05-17
**Scope:** internal refactor of `libs/typed-router/src/lib/types/` plus docs in `libs/typed-router/src/lib/typed-routes.ts`. No public API change.

## Goal

Make the type chain that produces `Path` and `Commands` easier for a human to read end-to-end. The chain currently spans seven files, contains two near-duplicate "distribute over `Routes[number]`" helpers, and silently encodes the `:param → RouteParamTypes[name]` lookup in two places that have already drifted. A reader has to load all of it into their head and trust that the parallel pieces agree.

Readability is the primary goal. The Medium blog post on this library walks readers through the type pipeline as the centerpiece; the cleaned-up chain should read close enough to a narrative that the blog can quote names and structure directly.

## Non-goals

- No public API changes. `Path`, `Commands`, `RouteParamTypes`, `UserTypedRoutes`, `TypedRouter`, `TypedRouterLink` stay as exported today.
- No folder reorganization inside `types/`. Files stay flat.
- No changes to `router.ts`, `router-link.ts`, or `schematics/`.
- No new features. This is a refactor + documentation pass.

## Current state (problems)

1. **Two parallel param-resolution implementations.** `ReplaceParams` (string-level) and `PathToCommandTuple` (segment-level) both encode `Name extends keyof RouteParamTypes ? RouteParamTypes[Name] : <fallback>`. A reader has to inspect both to know they agree. They don't — `ReplaceParams` returns `never` for an undeclared param, `PathToCommandTuple` returns `string`. Latent inconsistency; no test exercises it.
2. **Two structurally identical distributors.** `ExtractChildren` (inside `extract-paths-from-route.ts`) and `ExtractPathsFromRoutes` are the same `Routes[number] extends infer R ? R extends Route ? ExtractPathsFromRoute<R, Prefix> : never : never` pattern.
3. **`_ReplaceParams` underscore-prefix indirection.** Public `ReplaceParams` is a trivial re-export of `_ReplaceParams`; the indirection serves no purpose readers can identify.
4. **Dead code.** `ExtractParamNames` and `PathParams` are defined in `replace-params.ts`, used nowhere in the lib, and not exported from `index.ts`.
5. **No top-level narrative.** `typed-routes.ts` has no pipeline overview; a reader has to follow imports to discover the stages.
6. **Filename typo.** `is-navigatable.ts` → should be `is-navigable.ts`.
7. **Mixed concerns in one file.** `replace-params.ts` holds both the public augmentation interface (`RouteParamTypes`) and the string renderer implementation.
8. **Sparse docblocks.** Most internal types are one-liners with no `@example` and no statement of intent.

## Design

### Pipeline shape (after)

```
UserTypedRoutes['routes']      (consumer augmented)
            │
            ▼
ExtractRawPaths                walks the Route tree, keeps `:param` markers
            │
            ▼
RawPaths                       'home' | 'user/:id' | 'org/:org-id/...'
           ╱ ╲
          ╱   ╲
RawPathToUrl   RawPathToCommands     each renders a different shape
       │             │               (both via ResolveParam)
       ▼             ▼
     Path         Commands
```

This diagram lives at the top of `typed-routes.ts` as a JSDoc block.

### New `typed-routes.ts`

```ts
import { Route } from '@angular/router';
import { ExtractRawPaths } from './types/extract-raw-paths';
import { RawPathToUrl } from './types/raw-path-to-url';
import { RawPathToCommands } from './types/raw-path-to-commands';
import { RemoveTrailingSlash } from './types/remove-trailing-slash';

/**
 * Type-safe routes pipeline (all compile-time, zero runtime).
 *
 *   UserTypedRoutes['routes']           (consumer-augmented)
 *             │
 *             ▼
 *   ExtractRawPaths                     walks the Route tree, keeps `:param` markers
 *             │
 *             ▼
 *   RawPaths                            'home' | 'user/:id' | 'org/:org-id/...'
 *            ╱ ╲
 *           ╱   ╲
 *   RawPathToUrl   RawPathToCommands    each renders a different shape
 *         │             │               (both via ResolveParam)
 *         ▼             ▼
 *       Path         Commands
 */

/** Augmentation target. Consumers declare their routes here:
 *  `declare module 'angular-typed-router' { interface UserTypedRoutes { routes: typeof routes } }` */
export interface UserTypedRoutes {}

type ProvidedRoutes = UserTypedRoutes extends { routes: readonly Route[] }
  ? UserTypedRoutes['routes']
  : [];

/** Stage 1 output — every navigable path, `:param` markers intact. */
type RawPaths = ExtractRawPaths<ProvidedRoutes>;

/** Stage 2a — URL-string form, e.g. `'/home' | `/user/${UserId}` | ...`. */
export type Path = RemoveTrailingSlash<`/${RawPathToUrl<RawPaths>}`>;

/** Stage 2b — command-tuple form, e.g. `['/', 'home'] | ['/', 'user', UserId] | ...`. */
export type Commands = readonly ['/', ...RawPathToCommands<RawPaths>];
```

### Shared `ResolveParam`

Single source of truth for the `:param → RouteParamTypes[name]` lookup. Both renderers consume it.

```ts
// types/resolve-param.ts
import { RouteParamTypes } from './route-param-types';

/**
 * Resolves a single `:paramName` to its declared value type.
 *
 * Returns `never` for undeclared params, so a route with an undeclared
 * `:param` disappears from both Path and Commands. Chosen over a `string`
 * fallback to keep brand-type safety the default — consumers must declare
 * every param via the RouteParamTypes augmentation.
 *
 * @example
 *   declare module './route-param-types' {
 *     interface RouteParamTypes { id: UserId }
 *   }
 *   type X = ResolveParam<'id'>      // UserId
 *   type Y = ResolveParam<'unknown'> // never
 */
export type ResolveParam<Name extends string> =
  Name extends keyof RouteParamTypes ? RouteParamTypes[Name] : never;
```

**Behavior change:** today `Commands` returns `string` for an undeclared `:param`; after this, it returns `never` to match `Path`. Routes with undeclared params disappear from both. Locked in by new tests (see Test strategy).

### Two renderers — separate by necessity, symmetric in style

The renderers stay separate because they produce structurally different outputs (template-literal type vs. tuple). The bug fix in commit `66aa3b5` established that template-literal substitution widens brand types to `string` once re-split, so `Commands` cannot be derived from `Path`. The shared piece is `ResolveParam`, not the renderer.

```ts
// types/raw-path-to-url.ts
import { ResolveParam } from './resolve-param';
import { RootCatchAll } from './route-param-types';

/**
 * Substitutes `:paramName` markers with their resolved types, producing a
 * URL-string template-literal type. Brand types survive as type-level
 * placeholders (`/user/${UserId}`); they widen back to `string` if the
 * template is later re-split, which is why the tuple form has its own
 * renderer instead of being derived from this one.
 *
 * @example
 *   RawPathToUrl<'user/:id'>   // `user/${UserId}`
 *   RawPathToUrl<'home'>       // 'home'
 *   RawPathToUrl<'**'>         // RootCatchAll
 */
export type RawPathToUrl<S extends string> =
  S extends `${infer Start}:${infer Param}/${infer Rest}`
    ? `${Start}${ResolveParam<Param>}/${RawPathToUrl<Rest>}`
    : S extends `${infer Start}:${infer Param}`
      ? `${Start}${ResolveParam<Param>}`
      : S extends `${infer Start}**/${infer Rest}`
        ? `${Start}${string}/${RawPathToUrl<Rest>}`
        : S extends `${infer Start}**`
          ? Start extends '' ? RootCatchAll : `${Start}${string}`
          : S;
```

```ts
// types/raw-path-to-commands.ts
import { ResolveParam } from './resolve-param';

/**
 * Splits a raw path on `/` and resolves each `:paramName` segment directly.
 * Per-segment resolution is what preserves nominal/brand types in each tuple
 * slot — template-literal substitution would widen brands to `string` once
 * the result was re-split.
 *
 * @example
 *   RawPathToCommands<'user/:id'>   // ['user', UserId]
 *   RawPathToCommands<'home'>       // ['home']
 *   RawPathToCommands<''>           // []
 */
export type RawPathToCommands<P extends string> = P extends string
  ? P extends `${infer Head}/${infer Rest}`
    ? ResolveSegment<Head> extends infer H
      ? H extends string ? [H, ...RawPathToCommands<Rest>] : never
      : never
    : P extends ''
      ? []
      : ResolveSegment<P> extends infer H
        ? H extends string ? [H] : never
        : never
  : never;

/** Resolves one segment: `:param` → ResolveParam<Param>, literal → itself. */
type ResolveSegment<S extends string> =
  S extends `:${infer Name}` ? ResolveParam<Name> : Normalize<S>;

/** Collapses a non-literal `string` input to `string` to prevent recursion artifacts. */
type Normalize<S extends string> = string extends S ? string : S;
```

### Collapsed walker

`ExtractChildren` (the inner duplicate of `ExtractPathsFromRoutes`) is removed; `ExtractRawPathsFromRoute` calls `ExtractRawPaths` directly.

```ts
// types/extract-raw-paths.ts
import { Route } from '@angular/router';
import { ExtractRawPathsFromRoute } from './extract-raw-paths-from-route';

/**
 * Distributes over a Routes array, emitting every navigable path with
 * `:paramName` markers intact. `Prefix` accumulates the parent path on
 * each recursion step.
 *
 * @example
 *   ExtractRawPaths<[{ path: 'home', component: C }, { path: 'user/:id', component: C }]>
 *     // 'home' | 'user/:id'
 */
export type ExtractRawPaths<
  Routes extends readonly Route[],
  Prefix extends string = ''
> = Routes[number] extends infer R
  ? R extends Route
    ? ExtractRawPathsFromRoute<R, Prefix>
    : never
  : never;
```

```ts
// types/extract-raw-paths-from-route.ts
import { Route } from '@angular/router';
import { IsNavigable } from './is-navigable';
import { RoutePathOrEmpty } from './route-path-or-empty';
import { ExtractLazyChildRoutes } from './extract-lazy-child-routes';
import { JoinPathSegments } from './join-path-segments';
import { ExtractRawPaths } from './extract-raw-paths';

/**
 * Emits every navigable path reachable from a single Route, with `:paramName`
 * markers preserved. A Route contributes:
 *   - itself, if navigable (has component / loadComponent / redirectTo)
 *   - each of its children, prefixed with its own path
 *   - each of its lazy-loaded children, prefixed with its own path
 *
 * @example
 *   ExtractRawPathsFromRoute<{
 *     path: 'parent', component: C,
 *     children: [{ path: 'child', component: C }]
 *   }>
 *   // 'parent' | 'parent/child'
 */
export type ExtractRawPathsFromRoute<R extends Route, Prefix extends string = ''> =
  | (IsNavigable<R> extends true
      ? JoinPathSegments<Prefix, RoutePathOrEmpty<R>>
      : never)
  | (R['children'] extends readonly Route[]
      ? ExtractRawPaths<R['children'], JoinPathSegments<Prefix, RoutePathOrEmpty<R>>>
      : never)
  | (R['loadChildren'] extends () => Promise<any>
      ? ExtractRawPaths<ExtractLazyChildRoutes<R>, JoinPathSegments<Prefix, RoutePathOrEmpty<R>>>
      : never);
```

### File rename map (internal only)

| Before | After |
| --- | --- |
| `types/extract-paths-from-routes.ts` | `types/extract-raw-paths.ts` |
| `types/extract-paths-from-route.ts` | `types/extract-raw-paths-from-route.ts` |
| `types/replace-params.ts` | split → `types/route-param-types.ts` (interface + `RootCatchAll`) and `types/raw-path-to-url.ts` (renderer) |
| `types/path-to-command-tuple.ts` | `types/raw-path-to-commands.ts` |
| `types/path-or-empty-string.ts` | `types/route-path-or-empty.ts` |
| `types/is-navigatable.ts` | `types/is-navigable.ts` |
| `types/join-path-segments.ts` | unchanged |
| `types/remove-trailing-slash.ts` | unchanged |
| `types/extract-lazy-child-routes.ts` | unchanged |
| _(new)_ | `types/resolve-param.ts` |

All `*.test-d.ts` files rename to match their subject (`extract-paths-from-routes.test-d.ts` → `extract-raw-paths.test-d.ts`, etc.).

The public re-export in `index.ts` updates its source path only:
```ts
export type { RouteParamTypes } from './lib/types/route-param-types';  // was './lib/types/replace-params'
```
The exported name is unchanged, so consumer augmentations continue to work without modification.

### Resulting `types/` folder

```
extract-raw-paths.ts
extract-raw-paths-from-route.ts
extract-lazy-child-routes.ts
route-path-or-empty.ts
is-navigable.ts
join-path-segments.ts
route-param-types.ts          ← RouteParamTypes interface + RootCatchAll brand
resolve-param.ts              ← NEW shared :param lookup
raw-path-to-url.ts            ← was replace-params.ts (string renderer)
raw-path-to-commands.ts       ← was path-to-command-tuple.ts (tuple renderer)
remove-trailing-slash.ts
```

### Dead code removed

`ExtractParamNames` and `PathParams` are deleted entirely. They were defined in `replace-params.ts`, not used in the lib, and not exported from `index.ts`.

## Documentation style

Uniform across every internal type:

1. **What it does** — one sentence on the contract.
2. **Why-this-way** if non-obvious — only when there is a real gotcha (e.g., why two renderers exist; why `never` fallback).
3. **`@example`** — one or more input → output pairs illustrating the type's behavior. Use more than one when the type has meaningfully different branches (e.g. base case + recursive case). Inline arrow style:
   ```ts
   /**
    * @example
    *   JoinPathSegments<'a', 'b'>   // 'a/b'
    *   JoinPathSegments<'', 'b'>    // 'b'
    *   JoinPathSegments<'a', ''>    // 'a'
    */
   ```

Excluded from docblocks:
- Lists of callers / consumers (rots; cmd+B recovers it instantly).
- "See also" cross-references that are one click away.
- File-path mentions.

The pipeline ASCII diagram lives only in `typed-routes.ts`. Leaf types document themselves locally; they do not repeat the overview.

## Test strategy

- All existing `*.test-d.ts` files must keep passing unchanged in behavior (they will have their imports updated for the file renames). They are the regression net for the brand-preservation fix in `66aa3b5` and for the broader behavior.
- Two new test cases lock in the behavior change for `Commands`:
  ```ts
  it('Path drops routes whose :param is not declared in RouteParamTypes', ...)
  it('Commands drops routes whose :param is not declared in RouteParamTypes', ...)
  ```
- `nx test typed-router` runs green at every commit boundary in the implementation plan. Renames, the `ResolveParam` hoist, and the walker collapse each land as their own commit so a bisect can isolate any regression.

## Risk & mitigation

| Risk | Mitigation |
| --- | --- |
| Brand-type regression (the `66aa3b5` bug returning) | The brand tests added in `66aa3b5` stay in place. They run on every commit. |
| Hidden consumers of the internal type names | Verified via grep — no imports of `types/*` from outside the lib, and schematics don't reference these types. Public surface (`Path`, `Commands`, `RouteParamTypes`, `UserTypedRoutes`) is unchanged. |
| The `never` fallback drops a route silently if a consumer forgets to declare a param | This is the intentional behavior of the existing `Path` and the chosen fallback. New explicit tests document it. Surfaces the missing augmentation as "this route disappeared," which is a clearer signal than "it works but with `string`." |
| TypeScript inference depth limits on the recursive types | No change in recursion depth from today — same patterns, just renamed and slightly factored. |

## Out of scope

- Folder reorganization inside `types/`.
- Public API changes.
- New features.
- Documenting the public exports beyond what's in `typed-routes.ts`.
- Touching `router.ts`, `router-link.ts`, or schematics.
