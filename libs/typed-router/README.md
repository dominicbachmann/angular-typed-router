# angular-typed-router

## Attention: Still in experimental phase

Type-safe ergonomic primitives on top of Angular's standalone router. Automatically derive a compile‑time union of valid route URL strings (`Path`) and strongly typed navigation command tuples (`Commands`) from the consumer application's `Routes` definition – without generating code or adding runtime weight.

## Why

Angular's router is powerful but untyped for URL literals – a misspelled path or an outdated segment only fails at runtime. This library lets your application declare routes once, then:
- Navigate with `TypedRouter.navigateByUrl(path)` where `path` is validated at compile time.
- Use `<a routerLink="...">` with type checking via an augmented `TypedRouterLink` directive.
- Build command tuples with correct literal segments (`Commands` type).

No decorators, no custom builders, no code generation – just TypeScript type inference and interface augmentation.

## Installation

```bash
npm install angular-typed-router
# or
pnpm add angular-typed-router
# or
yarn add angular-typed-router
```

## Quick Start

1. Define your application routes:

```ts
// app.routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const appRoutes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'projects/:id', loadComponent: () => import('./project.component').then(m => m.ProjectComponent) },
  { path: '**', redirectTo: 'dashboard' }
] as const satisfies Routes;
```

2. Create the augmentation file so the library can “see” your routes:

```ts
// angular-typed-router.d.ts (sibling to main.ts or inside src/ root)
import type { appRoutes } from './app/app.routes';

declare module 'angular-typed-router' {
  interface UserTypedRoutes {
    routes: typeof appRoutes;
  }
}
```

3. Link the augmentation file in your tsconfig so the compiler includes it:

```jsonc
// tsconfig.app.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { },
  "include": [
    "src/**/*.ts",
    "angular-typed-router.d.ts" // <— add this line
  ]
}
```
If you have multiple tsconfigs, ensure the specific app tsconfig that drives the build/test includes the file.

4. Use the typed router & link:

```ts
import { Component, inject } from '@angular/core';
import { TypedRouter, Path } from 'angular-typed-router';

@Component({
  selector: 'app-nav',
  template: `
    <a routerLink="dashboard">Dashboard</a>
    <a routerLink="projects/123">Project 123</a>
  `
})
export class NavComponent {
  private readonly router = inject(TypedRouter);

  go(p: Path) { // p must be one of the inferred paths
    this.router.navigateByUrl(p);
  }

  openProject(id: string) {
    // commands tuple – first literal segment + dynamic param value
    this.router.navigate(['projects', id]);
  }
}
```

If you try `this.router.navigateByUrl('projcts/123')` (typo) or `<a routerLink="projcts/123">`, TypeScript errors.

## Exports

```ts
import { TypedRouter, TypedRouterLink, Path, Commands, UserTypedRoutes } from 'angular-typed-router';
```

- `TypedRouter` – Extends Angular `Router`, overrides `navigateByUrl` & `navigate` signatures to accept `Path` / `Commands`.
- `TypedRouterLink` – Directive shadowing `[routerLink]` to type its input as `Commands | Path`.
- `Path` – Union of every reachable concrete URL path produced from your route tree (includes parameterized expansions with `string` in place of `:param` segments).
- `Commands` – Union of tuple command arrays representing valid `Router.navigate()` inputs (each static segment as a literal, each parameter position as `string`).
- `UserTypedRoutes` – Empty interface you augment with your `routes` reference.
- `ExtractPathsFromRoutes<Routes>` – Utility type if you need to compute from an arbitrary `Routes` array manually.

## How It Works

1. You augment `UserTypedRoutes` with the literal `const` route array.
2. Type utilities recursively walk the route tree (including lazily loaded routes via `loadChildren` returning `Route[]` or `{ routes }`).
3. Each navigable route (component / loadComponent / redirectTo) contributes a path string. Param segments (`:id`) are replaced by `string` (currently unrestricted – see Limitations).
4. Child paths are joined with parents to form final concrete path unions.
5. A tuple transformation creates the `Commands` variants.

All compile-time only; nothing ships to runtime.

## Lazy Routes

Works with any lazy route whose `loadChildren` resolves to:
- `Promise<Route[]>`
- `Promise<{ routes: Route[] }>` (Angular v17+ pattern)

Example:

```ts
{ path: 'admin', loadChildren: () => import('./admin.routes').then(m => m.adminRoutes) }
```

Those child paths get prefixed (`admin/...`) in `Path` & `Commands`.

## Parameter Segments

A pattern `projects/:id/details/:section` produces a `Path` variant like:
```
'projects/' + string + '/details/' + string
```
and a `Commands` tuple like:
```
['projects', string, 'details', string]
```
You pass real runtime values for the `string` positions. Empty string values and values like 'param/still-param' cannot currently be prevented at the type level without hurting DX (see Limitations).

## Usage Patterns

Navigate by full path (typed):
```ts
router.navigateByUrl('/dashboard');
```
Navigate with commands array:
```ts
router.navigate(['/', 'projects', someId]);
```
Generate a `UrlTree`:
```ts
router.createUrlTree(['/', 'projects', id]);
```
Template links:
```html
<a routerLink="/projects/42">Project 42</a>
<a [routerLink]="['/', 'projects', projectId]"></a>
```


## Augmentation Placement

Keep the augmentation in a `.d.ts` that is included by `tsconfig.app.json` (`include` array). If you see `Path` still as `never`, ensure:
- The augmentation file is included.
- The `routes` constant is `as const satisfies Routes`.
- No circular import (augmentation file should only import the routes, nothing else runtime-heavy).

## Limitations & Tradeoffs

| Concern | Status / Rationale                                                                    |
|---------|---------------------------------------------------------------------------------------|
| Restrict param values (non-empty) | Not enforced; doing so significantly worsens DX (would reject plain `string` vars).   |
| Trailing slashes | Not generated unless authored; currently no auto-normalization.                       |
| `relativeTo` (relative navigation) | Not supported – all inferred `Path` / `Commands` are absolute. Use absolute commands. |


## ESLint Recommendation (Optional)

You can use `angular-typed-router-eslint` plugin to forbid untyped navigation calls.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Path` is `never` | Check augmentation file is included in tsconfig. |
| Lazy children missing | Ensure promise resolves to `Route[]` or `{ routes: Route[] }`. |
| Template error: unknown routerLink type | Ensure `TypedRouterLink` directive is imported (standalone). |

## Contributing

PRs welcome.

## License

MIT

---
Happy routing.
