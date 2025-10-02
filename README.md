# Angular Typed Router

Type-safe navigation for Angular. One source of truth (your `Routes` array) → inferred `Path` union + strongly typed `navigate` command tuples. No codegen, no runtime cost, just TypeScript.

This is an early release. Please try it out and file issues.

> Full docs & deep dive: [libs/typed-router/README.md](./libs/typed-router/README.md)

## Why
- Catch broken / misspelled route paths at compile time
- Refactors become safer (remove a route → instant red squiggles)
- Works with standalone components, lazy `loadChildren`, `loadComponent`
- Zero runtime weight (pure types)
- Drop-in: keep your existing routing setup

## Features
- `Path` – union of every concrete reachable URL
- `Commands` – typed tuples for `router.navigate([...])`
- `TypedRouter` – typed `navigate` / `navigateByUrl` / `createUrlTree`
- `TypedRouterLink` – typed `[routerLink]` in templates
- Recursive lazy route support (`loadChildren` returning `Route[]` or `{ routes }`)

## Install
```bash
npm i angular-typed-router
```

## Setup
```ts
// app.routes.ts
import { Routes } from '@angular/router';
export const appRoutes = [
  { path: 'dashboard', loadComponent: () => import('./dashboard') },
  { path: 'projects/:id', loadComponent: () => import('./project') },
] as const satisfies Routes;
```
```ts
// angular-typed-router.d.ts
import type { appRoutes } from './app/app.routes';

declare module 'angular-typed-router' {
  interface UserTypedRoutes {
    routes: typeof appRoutes;
  }
  // Customize route param types here
  interface AllowedRouteParamValues {
    ids: `${number}`;
    // other params...
  }
}
```
```ts
// some.component.ts
import { Component, inject } from '@angular/core';
import { TypedRouter, Path } from 'angular-typed-router';

@Component({
  selector: 'app-demo',
  template: `
    <a routerLink="/dashboard">Dashboard</a>
    <a routerLink="/projects/123">Project 123</a>
  `,
  standalone: true,
  imports: []
})
export class DemoComponent {
  private r = inject(TypedRouter);
  go(p: Path) { this.r.navigateByUrl(p); }
  open(id: string) { this.r.navigate(['/', 'projects', id]); }
}
```
Add the augmentation file to `tsconfig.app.json` include array.

## What You Get
| You do | You get |
|-------|---------|
| Remove route | Compiler errors where used |
| Mistype `routerLink` | Red squiggle instantly |
| Change segment order | All outdated usages flagged |


## Contribute
PRs welcome.

## License
MIT

