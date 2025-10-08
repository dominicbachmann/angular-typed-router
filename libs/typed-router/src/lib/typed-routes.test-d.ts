import { describe, it, expectTypeOf } from 'vitest';
import type { Route, Routes } from '@angular/router';
import type { Path, Commands } from './typed-routes';

class C {}
const lazyChildren = [{ path: 'sub', component: C }] as const satisfies Routes;

const routes = [
  { path: '', component: C },
  { path: 'home', component: C },
  { path: 'about', component: C },
  { path: 'parent', component: C, children: [{ path: 'child', component: C }] },
  {
    path: 'lazy',
    loadChildren: () => Promise.resolve(lazyChildren).then((m) => m),
  },
  { path: 'redirect', redirectTo: 'home', pathMatch: 'full' },
  { path: 'struct', children: [{ path: 'leaf', component: C }] },
  { path: 'user/:typed-routes', component: C },
] as const satisfies readonly Route[];

declare module './types/replace-params' {
  interface RouteParamTypes {
    'typed-routes': '123' | '456';
  }
}
declare module './typed-routes' {
  interface UserTypedRoutes {
    routes: typeof routes;
  }
}

describe('typed-routes augmented (with param values)', () => {
  type ExpectedPath =
    | '/'
    | '/home'
    | '/about'
    | '/parent'
    | '/parent/child'
    | '/lazy/sub'
    | '/redirect'
    | '/struct/leaf'
    | '/user/123'
    | '/user/456';

  it('Path equals precise union including expanded param routes', () => {
    expectTypeOf<Path>().toEqualTypeOf<ExpectedPath>();
  });

  it('Path includes both expanded param variants', () => {
    type UserPaths = Extract<Path, '/user/123' | '/user/456'>;
    expectTypeOf<UserPaths>().toEqualTypeOf<'/user/123' | '/user/456'>();
  });

  it('Path does not include raw colon param form', () => {
    type Raw = Extract<Path, '/user/:id'>;
    expectTypeOf<Raw>().toEqualTypeOf<never>();
  });

  type ExpectedCommands =
    | ['/']
    | ['/', 'home']
    | ['/', 'about']
    | ['/', 'parent']
    | ['/', 'parent', 'child']
    | ['/', 'lazy', 'sub']
    | ['/', 'redirect']
    | ['/', 'struct', 'leaf']
    | ['/', 'user', '123']
    | ['/', 'user', '456'];

  it('Commands equals union of tuple command arrays including param expansions', () => {
    expectTypeOf<Commands>().toEqualTypeOf<ExpectedCommands>();
  });

  it('Commands tuples all start with /', () => {
    type AllValid = Commands extends readonly ['/', ...any[]] ? true : false;
    expectTypeOf<AllValid>().toEqualTypeOf<true>();
  });
});
