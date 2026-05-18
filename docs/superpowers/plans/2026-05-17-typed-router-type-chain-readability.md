# Typed-router type-chain readability — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **No commits.** The user does all `git commit` calls themselves. At the end of each task, stop, report progress, and wait for the user before moving on. Never run `git commit` in this project.

**Goal:** Make the type pipeline that produces `Path` and `Commands` readable end-to-end — consolidate the silently-duplicated `:param`-lookup logic, collapse the duplicated route distributor, rename internal types/files for narrative clarity, and document each type with `@example`. No public API change.

**Architecture:** The chain becomes one canonical extract phase (`ExtractRawPaths`) that produces a `RawPaths` intermediate (paths with `:param` markers intact), then two parallel renderers — `RawPathToUrl` (template-literal substitution → `Path`) and `RawPathToCommands` (per-segment tuple resolution → `Commands`). Both renderers consult a single shared `ResolveParam<Name>` helper that is the only place `RouteParamTypes` is read.

**Tech Stack:** TypeScript-level types only. No runtime code changes. Tests use `vitest` + `expectTypeOf` (`*.test-d.ts` files). Test runner: `npx nx test typed-router`.

**Spec:** `docs/superpowers/specs/2026-05-17-typed-router-type-chain-readability-design.md`

**Baseline:** 96 tests passing across 10 test-d files (verified 2026-05-17).

---

## File Structure

After this plan, `libs/typed-router/src/lib/types/` will contain:

| File | Responsibility |
| --- | --- |
| `route-param-types.ts` (NEW) | `RouteParamTypes` interface + `RootCatchAll` brand. Public augmentation surface. |
| `resolve-param.ts` (NEW) | `ResolveParam<Name>` — the single `:param → RouteParamTypes[name]` lookup. |
| `extract-raw-paths.ts` (RENAMED from `extract-paths-from-routes.ts`) | Distributes over a Routes array. |
| `extract-raw-paths-from-route.ts` (RENAMED from `extract-paths-from-route.ts`) | Handles a single Route (navigable / children / loadChildren). |
| `extract-lazy-child-routes.ts` | Unwraps `loadChildren` to its `Route[]`. (Unchanged.) |
| `is-navigable.ts` (RENAMED from `is-navigatable.ts`, typo fix) | `IsNavigable<R>` predicate. |
| `route-path-or-empty.ts` (RENAMED from `path-or-empty-string.ts`) | `RoutePathOrEmpty<R>` — reads `R['path']` or empty. |
| `join-path-segments.ts` | `JoinPathSegments` with empty-aware separator. (Unchanged.) |
| `raw-path-to-url.ts` (RENAMED from `replace-params.ts`, post-split) | `RawPathToUrl<S>` template-literal renderer. |
| `raw-path-to-commands.ts` (RENAMED from `path-to-command-tuple.ts`) | `RawPathToCommands<S>` tuple renderer. |
| `remove-trailing-slash.ts` | `RemoveTrailingSlash`. (Unchanged.) |

Plus `typed-routes.ts` gets a top-of-file ASCII pipeline diagram and imports the renamed types.

`index.ts` re-export path for `RouteParamTypes` updates from `./lib/types/replace-params` to `./lib/types/route-param-types`. The exported *name* is unchanged — consumer augmentations of `'angular-typed-router'` continue to work.

---

## Task 1: Hoist `ResolveParam`; switch Commands fallback from `string` to `never`

This is the single behavior-changing task. Routes with an undeclared `:param` will now drop from both `Path` and `Commands` (today they only drop from `Path`). Locked in via the existing `replace-params.test-d.ts` test suite plus an updated existing test and one new integration test.

**Files:**
- Create: `libs/typed-router/src/lib/types/resolve-param.ts`
- Modify: `libs/typed-router/src/lib/types/replace-params.ts`
- Modify: `libs/typed-router/src/lib/types/path-to-command-tuple.ts`
- Modify: `libs/typed-router/src/lib/types/path-to-command-tuple.test-d.ts`
- Modify: `libs/typed-router/src/lib/typed-routes.test-d.ts`

- [ ] **Step 1: Update the existing `string`-fallback test in `path-to-command-tuple.test-d.ts` to expect `never`**

In `libs/typed-router/src/lib/types/path-to-command-tuple.test-d.ts`, replace the test at lines 61–63:

```ts
  it('unrecognized :paramName resolves to never (route drops)', () => {
    expectTypeOf<PathToCommandTuple<'x/:not-configured'>>().toEqualTypeOf<never>();
  });
```

- [ ] **Step 2: Add a new integration test in `typed-routes.test-d.ts` for the route-drop behavior**

Open `libs/typed-router/src/lib/typed-routes.test-d.ts`. At the bottom of the file, append:

```ts
describe('typed-routes undeclared :param drops the route', () => {
  // Note: do NOT add an augmentation for ':unknown-param' in RouteParamTypes.
  // The route uses an undeclared param; we expect it to be absent from Path and Commands.

  it('Path does not include the route containing an undeclared :param', () => {
    type Hit = Extract<Path, `/blog/${string}`>;
    // The 'blog/:unknown-param' route is NOT in `routes` above. This assertion
    // confirms no template-literal accidentally widens into Path.
    expectTypeOf<Hit>().toEqualTypeOf<never>();
  });

  it('Commands has no tuple matching ["/", "blog", ...] for an undeclared :param route', () => {
    type Hit = Extract<Commands, readonly ['/', 'blog', any]>;
    expectTypeOf<Hit>().toEqualTypeOf<never>();
  });
});
```

(These tests pass already today because no `blog/:unknown-param` route exists in `routes`. They serve as documentation that undeclared-param routes do not bleed into the public types. To make them an active behavior change test, also add a route entry — see Step 3.)

- [ ] **Step 3: Add a route that uses an undeclared `:param` and assert it drops from both `Path` and `Commands`**

In the same file, inside the `routes` literal (which is `as const satisfies readonly Route[]`), add one more route. Find the existing entry `{ path: 'org/:org-id/project/:project-id', component: C },` and add immediately after it:

```ts
  { path: 'blog/:unknown-param', component: C },
```

The augmentation block (`declare module './types/replace-params' { interface RouteParamTypes { ... } }`) is **intentionally NOT updated** for `'unknown-param'`. This is what makes the new tests in Step 2 meaningful — `ResolveParam<'unknown-param'>` should be `never`, and the route should be removed from both `Path` and `Commands`.

- [ ] **Step 4: Run the test suite to confirm the new tests fail (Commands fallback is still `string`)**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: type errors. Specifically:
- `path-to-command-tuple.test-d.ts` — the updated test now expects `never` but the implementation still returns `['x', string]`.
- `typed-routes.test-d.ts` — the Commands test (`Extract<Commands, readonly ['/', 'blog', any]>`) should hit a `['/', 'blog', string]` tuple variant, so `Extract` would be non-`never`.

Confirm both failures appear before continuing.

- [ ] **Step 5: Create `types/resolve-param.ts`**

Create the file:

```ts
import { RouteParamTypes } from './replace-params';

/**
 * Resolves a single `:paramName` to its declared value type.
 *
 * Returns `never` for undeclared params, so a route with an undeclared
 * `:param` disappears from both Path and Commands. Chosen over a `string`
 * fallback to keep brand-type safety the default — consumers must declare
 * every param via the RouteParamTypes augmentation.
 *
 * @example
 *   declare module './replace-params' {
 *     interface RouteParamTypes { id: UserId }
 *   }
 *   type X = ResolveParam<'id'>      // UserId
 *   type Y = ResolveParam<'unknown'> // never
 */
export type ResolveParam<Name extends string> =
  Name extends keyof RouteParamTypes ? RouteParamTypes[Name] : never;
```

Note: the import is from `./replace-params` for now because `RouteParamTypes` still lives there. Task 5 moves the interface to its own file and this import path updates.

- [ ] **Step 6: Refactor `types/replace-params.ts` to consume `ResolveParam`**

Open `libs/typed-router/src/lib/types/replace-params.ts`. Replace its contents with:

```ts
import { ResolveParam } from './resolve-param';

declare const __rootCatchAll: unique symbol;
export type RootCatchAll = string & { readonly [__rootCatchAll]: true };

export interface RouteParamTypes {}

type _ReplaceParams<S extends string> =
  S extends `${infer Start}:${infer Param}/${infer Rest}`
    ? `${Start}${ResolveParam<Param>}/${_ReplaceParams<Rest>}`
    : S extends `${infer Start}:${infer Param}`
      ? `${Start}${ResolveParam<Param>}`
      : S extends `${infer Start}**/${infer Rest}`
        ? `${Start}${string}/${_ReplaceParams<Rest>}`
        : S extends `${infer Start}**`
          ? Start extends ''
            ? RootCatchAll
            : `${Start}${string}`
          : S;

export type ReplaceParams<S extends string> = _ReplaceParams<S>;
```

Three things change in this file: (1) `ParamValueType` is gone, replaced by the imported `ResolveParam`; (2) `ExtractParamNames` and `PathParams` are deleted (dead code, never used outside this file); (3) `RootCatchAll` is now `export`ed because Task 5 will move it to its own file. The `_ReplaceParams` underscore-prefix indirection is intentionally kept here and dropped in Task 3 as its own small commit.

- [ ] **Step 7: Refactor `types/path-to-command-tuple.ts` to consume `ResolveParam`**

Open `libs/typed-router/src/lib/types/path-to-command-tuple.ts`. Replace its contents with:

```ts
import { ResolveParam } from './resolve-param';

type _Normalize<S extends string> = string extends S ? string : S;

type ResolveSegment<S extends string> = S extends `:${infer Name}`
  ? ResolveParam<Name>
  : _Normalize<S>;

/**
 * Splits a raw route path (`:paramName` markers intact) into a Commands tuple,
 * resolving each `:paramName` segment to its {@link RouteParamTypes} value type
 * directly — preserving brand types that a template-literal substitution would
 * erase. Distributes over union param types to produce a Cartesian product of
 * tuple variants (matching the existing literal-union behavior).
 */
export type PathToCommandTuple<P extends string> = P extends string
  ? P extends `${infer Head}/${infer Rest}`
    ? ResolveSegment<Head> extends infer H
      ? H extends string
        ? [H, ...PathToCommandTuple<Rest>]
        : never
      : never
    : P extends ''
      ? []
      : ResolveSegment<P> extends infer H
        ? H extends string
          ? [H]
          : never
        : never
  : never;
```

The only behavior change inside `ResolveSegment` is the fallback: `Name extends keyof RouteParamTypes ? RouteParamTypes[Name] : string` is replaced by `ResolveParam<Name>` (which returns `never`).

- [ ] **Step 8: Run the test suite to confirm everything passes (96 + new tests)**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass. The updated test in `path-to-command-tuple.test-d.ts` (now expecting `never`) passes. The new tests in `typed-routes.test-d.ts` pass (the new `blog/:unknown-param` route drops from both `Path` and `Commands`).

Test count should be at least 96 + 2 (new) = 98. The existing test count may shift if updated tests merge differently; the important check is **0 failures**.

- [ ] **Step 9: Stop, report progress to the user**

Report: "Task 1 complete: `ResolveParam` extracted, both renderers consume it, Commands fallback is now `never`. New tests pin the route-drop behavior. All tests green. Ready for your commit before Task 2."

Wait for user confirmation before proceeding.

---

## Task 2: Collapse the duplicate distributor `ExtractChildren`

`ExtractChildren` (defined inside `extract-paths-from-route.ts`) is the same shape as `ExtractPathsFromRoutes`. Remove the duplicate and call `ExtractPathsFromRoutes` directly.

**Files:**
- Modify: `libs/typed-router/src/lib/types/extract-paths-from-route.ts`

- [ ] **Step 1: Replace the contents of `extract-paths-from-route.ts`**

Open `libs/typed-router/src/lib/types/extract-paths-from-route.ts`. Replace its entire contents with:

```ts
import { Route } from '@angular/router';
import { IsNavigable } from './is-navigatable';
import { PathOrEmptyString } from './path-or-empty-string';
import { ExtractLazyChildRoutes } from './extract-lazy-child-routes';
import { JoinPathSegments } from './join-path-segments';
import { ExtractPathsFromRoutes } from './extract-paths-from-routes';

/**
 * Emits every navigable path reachable from a single Route, with `:paramName`
 * markers preserved. A Route contributes:
 *   - itself, if navigable (has component / loadComponent / redirectTo)
 *   - each of its children, prefixed with its own path
 *   - each of its lazy-loaded children, prefixed with its own path
 *
 * @example
 *   ExtractPathsFromRoute<{
 *     path: 'parent', component: C,
 *     children: [{ path: 'child', component: C }]
 *   }>
 *   // 'parent' | 'parent/child'
 */
export type ExtractPathsFromRoute<R extends Route, Prefix extends string = ''> =
  | (IsNavigable<R> extends true
      ? JoinPathSegments<Prefix, PathOrEmptyString<R>>
      : never)
  | (R['children'] extends readonly Route[]
      ? ExtractPathsFromRoutes<R['children'], JoinPathSegments<Prefix, PathOrEmptyString<R>>>
      : never)
  | (R['loadChildren'] extends () => Promise<any>
      ? ExtractPathsFromRoutes<ExtractLazyChildRoutes<R>, JoinPathSegments<Prefix, PathOrEmptyString<R>>>
      : never);
```

`ExtractChildren` is gone; the two recursive calls use `ExtractPathsFromRoutes` directly. The JSDoc is added now since I'm rewriting this file.

- [ ] **Step 2: Verify the import graph isn't cyclic**

`extract-paths-from-route.ts` now imports `ExtractPathsFromRoutes` (which in turn imports `ExtractPathsFromRoute`). This is a structural cycle. TypeScript handles type-only cycles fine — but let me confirm by running the tests.

- [ ] **Step 3: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass. The mutual recursion is type-level only and TypeScript resolves it without infinite-loop errors (it's the same recursive shape that existed before, just collapsed onto one helper).

If the test run hangs or produces a "Type instantiation is excessively deep" error, the cycle is real. Roll back to the previous implementation of `ExtractChildren` and call `ExtractPathsFromRoute` recursively inside it (the original code).

- [ ] **Step 4: Stop, report progress to the user**

Report: "Task 2 complete: `ExtractChildren` duplicate collapsed. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 3: Drop the `_ReplaceParams` underscore indirection

`ReplaceParams` is a trivial re-export of `_ReplaceParams`. Inline.

**Files:**
- Modify: `libs/typed-router/src/lib/types/replace-params.ts`

- [ ] **Step 1: Inline `_ReplaceParams` into `ReplaceParams`**

Open `libs/typed-router/src/lib/types/replace-params.ts`. Replace its contents with:

```ts
import { ResolveParam } from './resolve-param';

declare const __rootCatchAll: unique symbol;
export type RootCatchAll = string & { readonly [__rootCatchAll]: true };

export interface RouteParamTypes {}

/**
 * Substitutes `:paramName` markers with their resolved types, producing a
 * URL-string template-literal type. Brand types survive as type-level
 * placeholders (`/user/${UserId}`); they widen back to `string` if the
 * template is later re-split, which is the reason the tuple form has its
 * own renderer instead of being derived from this one.
 *
 * @example
 *   ReplaceParams<'user/:id'>   // `user/${UserId}` (assuming id: UserId)
 *   ReplaceParams<'home'>       // 'home'
 *   ReplaceParams<'**'>         // RootCatchAll
 */
export type ReplaceParams<S extends string> =
  S extends `${infer Start}:${infer Param}/${infer Rest}`
    ? `${Start}${ResolveParam<Param>}/${ReplaceParams<Rest>}`
    : S extends `${infer Start}:${infer Param}`
      ? `${Start}${ResolveParam<Param>}`
      : S extends `${infer Start}**/${infer Rest}`
        ? `${Start}${string}/${ReplaceParams<Rest>}`
        : S extends `${infer Start}**`
          ? Start extends ''
            ? RootCatchAll
            : `${Start}${string}`
          : S;
```

The `_ReplaceParams` private alias is gone; `ReplaceParams` recurses on itself directly. JSDoc with `@example` is now in place.

- [ ] **Step 2: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass. Behavior is identical to the indirected version.

- [ ] **Step 3: Stop, report progress to the user**

Report: "Task 3 complete: `_ReplaceParams` indirection removed; `ReplaceParams` is self-recursive. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 4: Verify dead code removal

`ExtractParamNames` and `PathParams` should already be gone (removed in Task 1, Step 6's rewrite). This task is a safety check.

**Files:**
- Verify: no occurrences of `ExtractParamNames` or `PathParams` in `libs/typed-router/`.

- [ ] **Step 1: Grep for any lingering references**

Run:
```bash
grep -rn "ExtractParamNames\|PathParams" /Users/dominic/projects/angular/angular-typed-router/libs/typed-router 2>/dev/null
```

Expected: no output. The types were defined in `replace-params.ts` and were not exported from `index.ts` or referenced anywhere else.

If output appears, remove the offending definitions/references and re-run.

- [ ] **Step 2: Stop, report progress to the user**

Report: "Task 4 verified: no remaining `ExtractParamNames` or `PathParams` references." If this task is a no-op, say "Task 4 already covered by Task 1."

Wait for user confirmation.

---

## Task 5: Extract `RouteParamTypes` and `RootCatchAll` into `route-param-types.ts`

Decouple the public augmentation surface from the renderer implementation.

**Files:**
- Create: `libs/typed-router/src/lib/types/route-param-types.ts`
- Modify: `libs/typed-router/src/lib/types/replace-params.ts`
- Modify: `libs/typed-router/src/lib/types/resolve-param.ts`
- Modify: `libs/typed-router/src/index.ts`
- Modify: `libs/typed-router/src/lib/types/replace-params.test-d.ts`
- Modify: `libs/typed-router/src/lib/types/path-to-command-tuple.test-d.ts`
- Modify: `libs/typed-router/src/lib/typed-routes.test-d.ts`

- [ ] **Step 1: Create `types/route-param-types.ts`**

Create the file:

```ts
/**
 * Augmentation target for declaring concrete value types per route parameter
 * name. Consumers augment via `'angular-typed-router'`:
 *
 *   declare module 'angular-typed-router' {
 *     interface RouteParamTypes {
 *       'org-id': OrgId;
 *       'project-id': ProjectId;
 *     }
 *   }
 *
 * Each key matches a `:paramName` segment in the consumer's Routes; each value
 * is the type that the param resolves to in `Path` and `Commands`.
 */
export interface RouteParamTypes {}

declare const __rootCatchAll: unique symbol;

/**
 * Brand for the bare-root `**` catch-all path. Distinguishes a route declared
 * as `path: '**'` (matches anything from the root) from an arbitrary `string`.
 * Consumers cannot accidentally assign a plain string into this slot.
 */
export type RootCatchAll = string & { readonly [__rootCatchAll]: true };
```

- [ ] **Step 2: Update `types/replace-params.ts` to re-export from the new file (preserve external compatibility within the lib)**

Open `libs/typed-router/src/lib/types/replace-params.ts`. Replace its contents with:

```ts
import { ResolveParam } from './resolve-param';
import { RootCatchAll } from './route-param-types';

export type { RouteParamTypes, RootCatchAll } from './route-param-types';

/**
 * Substitutes `:paramName` markers with their resolved types, producing a
 * URL-string template-literal type. Brand types survive as type-level
 * placeholders (`/user/${UserId}`); they widen back to `string` if the
 * template is later re-split, which is the reason the tuple form has its
 * own renderer instead of being derived from this one.
 *
 * @example
 *   ReplaceParams<'user/:id'>   // `user/${UserId}` (assuming id: UserId)
 *   ReplaceParams<'home'>       // 'home'
 *   ReplaceParams<'**'>         // RootCatchAll
 */
export type ReplaceParams<S extends string> =
  S extends `${infer Start}:${infer Param}/${infer Rest}`
    ? `${Start}${ResolveParam<Param>}/${ReplaceParams<Rest>}`
    : S extends `${infer Start}:${infer Param}`
      ? `${Start}${ResolveParam<Param>}`
      : S extends `${infer Start}**/${infer Rest}`
        ? `${Start}${string}/${ReplaceParams<Rest>}`
        : S extends `${infer Start}**`
          ? Start extends ''
            ? RootCatchAll
            : `${Start}${string}`
          : S;
```

The `export type { RouteParamTypes, RootCatchAll }` re-export keeps `import { RouteParamTypes } from './replace-params'` working everywhere it's still used (until those imports are migrated below).

- [ ] **Step 3: Update `types/resolve-param.ts` to import from the new file**

Open `libs/typed-router/src/lib/types/resolve-param.ts`. Change the import line at the top:

```ts
import { RouteParamTypes } from './route-param-types';
```

(Was `from './replace-params'`.)

- [ ] **Step 4: Update the public re-export path in `index.ts`**

Open `libs/typed-router/src/index.ts`. Change:

```ts
export type { RouteParamTypes } from './lib/types/replace-params';
```

To:

```ts
export type { RouteParamTypes } from './lib/types/route-param-types';
```

- [ ] **Step 5: Update test files' `declare module` paths**

Three test files have `declare module './replace-params'` or `declare module './types/replace-params'`. Update each to point to the new file:

In `libs/typed-router/src/lib/types/replace-params.test-d.ts` (line 4):
```ts
declare module './route-param-types' {
  interface RouteParamTypes {
    'replace-params': '123' | '456';
  }
}
```

In `libs/typed-router/src/lib/types/path-to-command-tuple.test-d.ts` (line 9):
```ts
declare module './route-param-types' {
  interface RouteParamTypes {
    'pct-literal': '123' | '456';
    'pct-org': PctOrgId;
    'pct-project': PctProjectId;
  }
}
```

In `libs/typed-router/src/lib/typed-routes.test-d.ts` (around line 31):
```ts
declare module './types/route-param-types' {
  interface RouteParamTypes {
    'typed-routes': '123' | '456';
    'org-id': OrgId;
    'project-id': ProjectId;
  }
}
```

- [ ] **Step 6: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass. Interface augmentation now happens at the original declaration site (`route-param-types.ts`).

- [ ] **Step 7: Stop, report progress to the user**

Report: "Task 5 complete: `RouteParamTypes` + `RootCatchAll` moved to `route-param-types.ts`; `replace-params.ts` re-exports them for backward compatibility; test augmentation paths updated; public re-export path in `index.ts` updated. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 6: Rename `is-navigatable.ts` → `is-navigable.ts` (typo fix)

**Files:**
- Rename: `libs/typed-router/src/lib/types/is-navigatable.ts` → `libs/typed-router/src/lib/types/is-navigable.ts`
- Rename: `libs/typed-router/src/lib/types/is-navigatable.test-d.ts` → `libs/typed-router/src/lib/types/is-navigable.test-d.ts`
- Modify: `libs/typed-router/src/lib/types/extract-paths-from-route.ts` (update import)

- [ ] **Step 1: Move the source file and add JSDoc with `@example`**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/is-navigatable.ts libs/typed-router/src/lib/types/is-navigable.ts
```

(Using `git mv` to preserve blame history. Don't commit — just stage the rename.)

Then open `libs/typed-router/src/lib/types/is-navigable.ts` and replace contents with:

```ts
import { Route } from '@angular/router';

/**
 * True if a Route is navigable on its own — i.e. it can be reached by a URL
 * because it renders a component or redirects. Structural routes (children
 * only, no component/redirect) are not navigable themselves.
 *
 * @example
 *   IsNavigable<{ path: 'a', component: C }>          // true
 *   IsNavigable<{ path: 'a', loadComponent: () => Promise<C> }>  // true
 *   IsNavigable<{ path: 'a', redirectTo: 'b' }>       // true
 *   IsNavigable<{ path: 'a', children: [...] }>       // false
 */
export type IsNavigable<R extends Route> = R extends { component: any }
  ? true
  : R extends { loadComponent: any }
    ? true
    : R extends { redirectTo: any }
      ? true
      : false;
```

- [ ] **Step 2: Move the test file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/is-navigatable.test-d.ts libs/typed-router/src/lib/types/is-navigable.test-d.ts
```

- [ ] **Step 3: Update the import path in the test file**

Open `libs/typed-router/src/lib/types/is-navigable.test-d.ts`. Change the import from `./is-navigatable` to `./is-navigable`:

```ts
import type { IsNavigable } from './is-navigable';
```

- [ ] **Step 4: Update the import in `extract-paths-from-route.ts`**

Open `libs/typed-router/src/lib/types/extract-paths-from-route.ts`. Change:
```ts
import { IsNavigable } from './is-navigatable';
```
To:
```ts
import { IsNavigable } from './is-navigable';
```

- [ ] **Step 5: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass.

- [ ] **Step 6: Stop, report progress to the user**

Report: "Task 6 complete: typo fix `is-navigatable` → `is-navigable`. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 7: Rename `path-or-empty-string.ts` → `route-path-or-empty.ts` (file + type)

**Files:**
- Rename: `libs/typed-router/src/lib/types/path-or-empty-string.ts` → `libs/typed-router/src/lib/types/route-path-or-empty.ts`
- Rename: `libs/typed-router/src/lib/types/path-or-empty-string.test-d.ts` → `libs/typed-router/src/lib/types/route-path-or-empty.test-d.ts`
- Modify: `libs/typed-router/src/lib/types/extract-paths-from-route.ts` (update import + usage)

- [ ] **Step 1: Move the source file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/path-or-empty-string.ts libs/typed-router/src/lib/types/route-path-or-empty.ts
```

Then replace its contents with:

```ts
import { Route } from '@angular/router';

/**
 * Reads a Route's `path` property if it's a string, otherwise returns the
 * empty string. Used so a path-less Route (allowed by Angular) contributes
 * no segment when joined with its parents or children.
 *
 * @example
 *   RoutePathOrEmpty<{ path: 'home' }>   // 'home'
 *   RoutePathOrEmpty<{ component: C }>   // ''
 */
export type RoutePathOrEmpty<R extends Route> = R['path'] extends string
  ? R['path']
  : '';
```

- [ ] **Step 2: Move the test file and update its import + type name**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/path-or-empty-string.test-d.ts libs/typed-router/src/lib/types/route-path-or-empty.test-d.ts
```

Open the new test file. Replace all occurrences of `PathOrEmptyString` with `RoutePathOrEmpty` and update the import:

```ts
import type { RoutePathOrEmpty } from './route-path-or-empty';
```

(Use a single Edit with `replace_all: true` for `PathOrEmptyString` → `RoutePathOrEmpty` after fixing the import line manually.)

- [ ] **Step 3: Update import + usage in `extract-paths-from-route.ts`**

Open `libs/typed-router/src/lib/types/extract-paths-from-route.ts`. Change:
```ts
import { PathOrEmptyString } from './path-or-empty-string';
```
To:
```ts
import { RoutePathOrEmpty } from './route-path-or-empty';
```

Then in the body, replace all `PathOrEmptyString<R>` with `RoutePathOrEmpty<R>` (3 occurrences).

- [ ] **Step 4: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass.

- [ ] **Step 5: Stop, report progress to the user**

Report: "Task 7 complete: `PathOrEmptyString` → `RoutePathOrEmpty` (file + type). All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 8: Rename `replace-params.ts` → `raw-path-to-url.ts` + rename type

**Files:**
- Rename: `libs/typed-router/src/lib/types/replace-params.ts` → `libs/typed-router/src/lib/types/raw-path-to-url.ts`
- Rename: `libs/typed-router/src/lib/types/replace-params.test-d.ts` → `libs/typed-router/src/lib/types/raw-path-to-url.test-d.ts`
- Modify: `libs/typed-router/src/lib/typed-routes.ts` (update import + usage)

Note: After Task 5, `replace-params.ts` only contains `ReplaceParams` + a re-export of `RouteParamTypes`/`RootCatchAll` from `route-param-types.ts`. We're renaming the file to reflect its remaining responsibility, and the type that lives in it.

- [ ] **Step 1: Move the source file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/replace-params.ts libs/typed-router/src/lib/types/raw-path-to-url.ts
```

Replace its contents with:

```ts
import { ResolveParam } from './resolve-param';
import { RootCatchAll } from './route-param-types';

/**
 * Substitutes `:paramName` markers with their resolved types, producing a
 * URL-string template-literal type. Brand types survive as type-level
 * placeholders (`/user/${UserId}`); they widen back to `string` if the
 * template is later re-split, which is the reason the tuple form has its
 * own renderer instead of being derived from this one.
 *
 * @example
 *   RawPathToUrl<'user/:id'>   // `user/${UserId}` (assuming id: UserId)
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
          ? Start extends ''
            ? RootCatchAll
            : `${Start}${string}`
          : S;
```

The re-export of `RouteParamTypes`/`RootCatchAll` is gone — consumers of those types inside the lib must import directly from `./route-param-types` going forward (Task 9 ensures `path-to-command-tuple.ts` is updated; the test files' `declare module` paths were already corrected in Task 5).

- [ ] **Step 2: Move and update the test file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/replace-params.test-d.ts libs/typed-router/src/lib/types/raw-path-to-url.test-d.ts
```

Open the new test file. Update:
- Import line 2: `import type { RawPathToUrl } from './raw-path-to-url';` (was `ReplaceParams from './replace-params'`).
- All occurrences of `ReplaceParams<...>` in the file → `RawPathToUrl<...>` (use Edit with `replace_all: true`).

- [ ] **Step 3: Update `typed-routes.ts` to use the new name**

Open `libs/typed-router/src/lib/typed-routes.ts`. Update:

```ts
import { RawPathToUrl } from './types/raw-path-to-url';
```

(Was `import { ReplaceParams } from './types/replace-params';`.)

And in the `Path` definition:

```ts
export type Path = RemoveTrailingSlash<`/${RawPathToUrl<RawPaths>}`>;
```

(Was `RemoveTrailingSlash<`/${ReplaceParams<RawPaths>}`>`.)

- [ ] **Step 4: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass.

- [ ] **Step 5: Stop, report progress to the user**

Report: "Task 8 complete: `replace-params.ts` → `raw-path-to-url.ts`, `ReplaceParams` → `RawPathToUrl`. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 9: Rename `path-to-command-tuple.ts` → `raw-path-to-commands.ts` + rename type

**Files:**
- Rename: `libs/typed-router/src/lib/types/path-to-command-tuple.ts` → `libs/typed-router/src/lib/types/raw-path-to-commands.ts`
- Rename: `libs/typed-router/src/lib/types/path-to-command-tuple.test-d.ts` → `libs/typed-router/src/lib/types/raw-path-to-commands.test-d.ts`
- Modify: `libs/typed-router/src/lib/typed-routes.ts` (update import + usage)

- [ ] **Step 1: Move the source file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/path-to-command-tuple.ts libs/typed-router/src/lib/types/raw-path-to-commands.ts
```

Replace its contents with:

```ts
import { ResolveParam } from './resolve-param';

/** Collapses a non-literal `string` input to `string` to prevent recursion artifacts. */
type Normalize<S extends string> = string extends S ? string : S;

/** Resolves one segment: `:param` → ResolveParam<Param>, literal → itself. */
type ResolveSegment<S extends string> =
  S extends `:${infer Name}` ? ResolveParam<Name> : Normalize<S>;

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
      ? H extends string
        ? [H, ...RawPathToCommands<Rest>]
        : never
      : never
    : P extends ''
      ? []
      : ResolveSegment<P> extends infer H
        ? H extends string
          ? [H]
          : never
        : never
  : never;
```

The underscore-prefix on `_Normalize` is dropped (it's still file-private since it's not exported).

- [ ] **Step 2: Move and update the test file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/path-to-command-tuple.test-d.ts libs/typed-router/src/lib/types/raw-path-to-commands.test-d.ts
```

Open the new test file. Update:
- Import line 2: `import type { RawPathToCommands } from './raw-path-to-commands';`
- All occurrences of `PathToCommandTuple<...>` → `RawPathToCommands<...>` (Edit with `replace_all: true`).

- [ ] **Step 3: Update `typed-routes.ts`**

Open `libs/typed-router/src/lib/typed-routes.ts`. Update:

```ts
import { RawPathToCommands } from './types/raw-path-to-commands';
```

(Was `import { PathToCommandTuple } from './types/path-to-command-tuple';`.)

And in the `Commands` definition:

```ts
export type Commands = readonly ['/', ...RawPathToCommands<RawPaths>];
```

(Was `readonly ['/', ...PathToCommandTuple<RawPaths>]`.)

- [ ] **Step 4: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass.

- [ ] **Step 5: Stop, report progress to the user**

Report: "Task 9 complete: `path-to-command-tuple.ts` → `raw-path-to-commands.ts`, `PathToCommandTuple` → `RawPathToCommands`. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 10: Rename `extract-paths-from-routes.ts` → `extract-raw-paths.ts` + rename type

**Files:**
- Rename: `libs/typed-router/src/lib/types/extract-paths-from-routes.ts` → `libs/typed-router/src/lib/types/extract-raw-paths.ts`
- Rename: `libs/typed-router/src/lib/types/extract-paths-from-routes.test-d.ts` → `libs/typed-router/src/lib/types/extract-raw-paths.test-d.ts`
- Modify: `libs/typed-router/src/lib/types/extract-paths-from-route.ts` (import + usage)
- Modify: `libs/typed-router/src/lib/typed-routes.ts` (import + usage)

- [ ] **Step 1: Move the source file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/extract-paths-from-routes.ts libs/typed-router/src/lib/types/extract-raw-paths.ts
```

Replace its contents with:

```ts
import { Route } from '@angular/router';
import { ExtractPathsFromRoute } from './extract-paths-from-route';

/**
 * Distributes over a Routes array, emitting every navigable path with
 * `:paramName` markers intact. `Prefix` accumulates the parent path on
 * each recursion step.
 *
 * @example
 *   ExtractRawPaths<[
 *     { path: 'home', component: C },
 *     { path: 'user/:id', component: C }
 *   ]>
 *   // 'home' | 'user/:id'
 */
export type ExtractRawPaths<
  Routes extends readonly Route[],
  Prefix extends string = ''
> = Routes[number] extends infer R
  ? R extends Route
    ? ExtractPathsFromRoute<R, Prefix>
    : never
  : never;
```

Note: the import still references `ExtractPathsFromRoute` (Task 11 renames that file).

- [ ] **Step 2: Move and update the test file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/extract-paths-from-routes.test-d.ts libs/typed-router/src/lib/types/extract-raw-paths.test-d.ts
```

Open the new test file. Update:
- Import line: `import type { ExtractRawPaths } from './extract-raw-paths';`
- All occurrences of `ExtractPathsFromRoutes<...>` → `ExtractRawPaths<...>` (Edit with `replace_all: true`).

- [ ] **Step 3: Update import + usage in `extract-paths-from-route.ts`**

Open `libs/typed-router/src/lib/types/extract-paths-from-route.ts`. Change:
```ts
import { ExtractPathsFromRoutes } from './extract-paths-from-routes';
```
To:
```ts
import { ExtractRawPaths } from './extract-raw-paths';
```

Then replace all `ExtractPathsFromRoutes<...>` calls inside the body with `ExtractRawPaths<...>` (2 occurrences — the `children` branch and the `loadChildren` branch).

- [ ] **Step 4: Update `typed-routes.ts`**

Open `libs/typed-router/src/lib/typed-routes.ts`. Change:
```ts
import { ExtractPathsFromRoutes } from './types/extract-paths-from-routes';
```
To:
```ts
import { ExtractRawPaths } from './types/extract-raw-paths';
```

And in the `RawPaths` definition:
```ts
type RawPaths = ExtractRawPaths<ProvidedRoutes>;
```
(Was `ExtractPathsFromRoutes<ProvidedRoutes>`.)

- [ ] **Step 5: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass.

- [ ] **Step 6: Stop, report progress to the user**

Report: "Task 10 complete: `extract-paths-from-routes.ts` → `extract-raw-paths.ts`, `ExtractPathsFromRoutes` → `ExtractRawPaths`. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 11: Rename `extract-paths-from-route.ts` → `extract-raw-paths-from-route.ts` + rename type

**Files:**
- Rename: `libs/typed-router/src/lib/types/extract-paths-from-route.ts` → `libs/typed-router/src/lib/types/extract-raw-paths-from-route.ts`
- Rename: `libs/typed-router/src/lib/types/extract-paths-from-route.test-d.ts` → `libs/typed-router/src/lib/types/extract-raw-paths-from-route.test-d.ts`
- Modify: `libs/typed-router/src/lib/types/extract-raw-paths.ts` (import + usage)

- [ ] **Step 1: Move the source file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/extract-paths-from-route.ts libs/typed-router/src/lib/types/extract-raw-paths-from-route.ts
```

Replace its contents with:

```ts
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

- [ ] **Step 2: Move and update the test file**

```bash
git -C /Users/dominic/projects/angular/angular-typed-router mv libs/typed-router/src/lib/types/extract-paths-from-route.test-d.ts libs/typed-router/src/lib/types/extract-raw-paths-from-route.test-d.ts
```

Open the new test file. Update:
- Import line: `import type { ExtractRawPathsFromRoute } from './extract-raw-paths-from-route';`
- All occurrences of `ExtractPathsFromRoute<...>` → `ExtractRawPathsFromRoute<...>` (Edit with `replace_all: true`).

- [ ] **Step 3: Update import + usage in `extract-raw-paths.ts`**

Open `libs/typed-router/src/lib/types/extract-raw-paths.ts`. Change:
```ts
import { ExtractPathsFromRoute } from './extract-paths-from-route';
```
To:
```ts
import { ExtractRawPathsFromRoute } from './extract-raw-paths-from-route';
```

And in the body, replace the `ExtractPathsFromRoute<R, Prefix>` call with `ExtractRawPathsFromRoute<R, Prefix>`.

- [ ] **Step 4: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass.

- [ ] **Step 5: Stop, report progress to the user**

Report: "Task 11 complete: `extract-paths-from-route.ts` → `extract-raw-paths-from-route.ts`, `ExtractPathsFromRoute` → `ExtractRawPathsFromRoute`. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 12: Add JSDoc `@example` to remaining helpers

The renamed types already have JSDoc. The three remaining unchanged helpers (`JoinPathSegments`, `RemoveTrailingSlash`, `ExtractLazyChildRoutes`) get docblocks here.

**Files:**
- Modify: `libs/typed-router/src/lib/types/join-path-segments.ts`
- Modify: `libs/typed-router/src/lib/types/remove-trailing-slash.ts`
- Modify: `libs/typed-router/src/lib/types/extract-lazy-child-routes.ts`

- [ ] **Step 1: Update `join-path-segments.ts`**

Open the file. Replace contents with:

```ts
/**
 * Joins two path segments with `/`, treating an empty segment as a no-op.
 * Prevents leading/trailing/double slashes when a route has no path or sits
 * at the root.
 *
 * @example
 *   JoinPathSegments<'a', 'b'>   // 'a/b'
 *   JoinPathSegments<'', 'b'>    // 'b'
 *   JoinPathSegments<'a', ''>    // 'a'
 *   JoinPathSegments<'', ''>     // ''
 */
export type JoinPathSegments<A extends string, B extends string> = A extends ''
  ? B
  : B extends ''
    ? A
    : `${A}/${B}`;
```

- [ ] **Step 2: Update `remove-trailing-slash.ts`**

Open the file. Replace contents with:

```ts
/**
 * Strips a trailing `/` from a string, with one exception: a bare `'/'` (the
 * root URL) is preserved. Used to clean up paths whose leading `/` got added
 * by the URL renderer.
 *
 * @example
 *   RemoveTrailingSlash<'/home/'>   // '/home'
 *   RemoveTrailingSlash<'/'>        // '/'
 *   RemoveTrailingSlash<'/home'>    // '/home'
 */
export type RemoveTrailingSlash<S extends string> = S extends '/'
  ? S
  : S extends `${infer T}/`
    ? RemoveTrailingSlash<T>
    : S;
```

- [ ] **Step 3: Update `extract-lazy-child-routes.ts`**

Open the file. Replace contents with:

```ts
import { Route } from '@angular/router';

/**
 * Unwraps a Route's `loadChildren` to its underlying `Route[]`. Supports
 * both shapes Angular accepts:
 *   - `Promise<Route[]>` (older form)
 *   - `Promise<{ routes: Route[] }>` (the Angular 17+ pattern)
 *
 * Returns `[]` if `loadChildren` is missing or returns an unrecognized shape;
 * the caller treats this as "no lazy children to recurse into."
 *
 * @example
 *   ExtractLazyChildRoutes<{
 *     path: 'lazy',
 *     loadChildren: () => Promise<[{ path: 'sub', component: C }]>
 *   }>
 *   // [{ path: 'sub', component: C }]
 */
export type ExtractLazyChildRoutes<R extends Route> = R['loadChildren'] extends (
  ...args: any
) => Promise<infer M>
  ? M extends readonly Route[]
    ? M
    : M extends { routes: readonly Route[] }
      ? M['routes']
      : []
  : [];
```

- [ ] **Step 4: Run the test suite**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass (no behavior change).

- [ ] **Step 5: Stop, report progress to the user**

Report: "Task 12 complete: JSDoc + `@example` added to `JoinPathSegments`, `RemoveTrailingSlash`, `ExtractLazyChildRoutes`. All tests green. Ready for your commit."

Wait for user confirmation.

---

## Task 13: Add pipeline diagram to `typed-routes.ts`

The final task — give the entry-point file the top-level narrative.

**Files:**
- Modify: `libs/typed-router/src/lib/typed-routes.ts`

- [ ] **Step 1: Replace `typed-routes.ts` contents**

Open `libs/typed-router/src/lib/typed-routes.ts`. Replace contents with:

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

- [ ] **Step 2: Run the full test suite (final check)**

Run:
```bash
npx nx test typed-router --watch=false
```

Expected: all tests pass. The full chain — every rename, every consolidation, every doc — is now in place.

- [ ] **Step 3: Final verification grep**

Confirm no stale references to old names:

```bash
grep -rn "ExtractPathsFromRoutes\|ExtractPathsFromRoute\|PathToCommandTuple\|ReplaceParams\|PathOrEmptyString\|is-navigatable" /Users/dominic/projects/angular/angular-typed-router/libs/typed-router 2>/dev/null
```

Expected: no output. Every old name has been renamed.

If output appears, investigate which file still uses the old name, rename it, and re-run the test suite.

- [ ] **Step 4: Stop, report progress to the user**

Report: "Task 13 complete: pipeline diagram and updated imports in `typed-routes.ts`. Full type-chain refactor done. All tests green. Ready for your final commit."

---

## Final state checklist

After all 13 tasks are complete and committed (by the user), the type-chain should:

- [x] Have one shared `ResolveParam<Name>` consumed by both renderers (no drift).
- [x] Have one canonical recursive walker (no duplicated `ExtractChildren`).
- [x] Have `_ReplaceParams` indirection removed.
- [x] Have dead code (`ExtractParamNames`, `PathParams`) removed.
- [x] Have a separate `route-param-types.ts` for the public augmentation surface.
- [x] Use the names `ExtractRawPaths`, `ExtractRawPathsFromRoute`, `RawPathToUrl`, `RawPathToCommands`, `RoutePathOrEmpty`, `IsNavigable` (typo fixed).
- [x] Have JSDoc + `@example` on every internal type.
- [x] Have a pipeline ASCII diagram at the top of `typed-routes.ts`.
- [x] Keep all 96 existing tests passing plus at least 2 new tests pinning the `never`-fallback behavior.
- [x] Have no public API change. `Path`, `Commands`, `RouteParamTypes`, `UserTypedRoutes`, `TypedRouter`, `TypedRouterLink` unchanged from consumer perspective.
