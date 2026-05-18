import { describe, it, expectTypeOf } from 'vitest';
import type { Route } from '@angular/router';
import type { ExtractRawPaths } from './extract-raw-paths';

class C {}
const makePromise = <T>(v: T) => Promise.resolve(v);

describe('ExtractRawPaths', () => {
  it('union of simple leaf routes (components)', () => {
    const routes = [
      { path: 'home', component: C },
      { path: 'about', component: C },
    ] as const satisfies readonly Route[];
    expectTypeOf<ExtractRawPaths<typeof routes>>().toEqualTypeOf<
      'home' | 'about'
    >();
  });

  it(':paramName route preserved in raw form alongside static path', () => {
    const routes = [
      { path: ':x', component: C },
      { path: 'static', component: C },
    ] as const satisfies readonly Route[];
    expectTypeOf<ExtractRawPaths<typeof routes>>().toEqualTypeOf<':x' | 'static'>();
  });

  it('structural route contributes only its descendants', () => {
    const routes = [
      { path: 'parent', children: [{ path: 'child', component: C }] },
    ] as const satisfies readonly Route[];
    expectTypeOf<ExtractRawPaths<typeof routes>>().toEqualTypeOf<'parent/child'>();
  });

  it('route with component and children adds both parent and nested', () => {
    const routes = [
      { path: 'dash', component: C, children: [{ path: 'deep', component: C }] },
    ] as const satisfies readonly Route[];
    expectTypeOf<ExtractRawPaths<typeof routes>>().toEqualTypeOf<
      'dash' | 'dash/deep'
    >();
  });

  it('lazy loaded child routes are prefixed', () => {
    const routes = [
      { path: 'lazy', loadChildren: () => makePromise([{ path: 'sub', component: C }] as const) },
    ] as const satisfies readonly Route[];
    expectTypeOf<ExtractRawPaths<typeof routes>>().toEqualTypeOf<'lazy/sub'>();
  });

  it('empty root path component yields empty string among others', () => {
    const routes = [
      { path: '', component: C },
      { path: 'a', component: C },
    ] as const satisfies readonly Route[];
    expectTypeOf<ExtractRawPaths<typeof routes>>().toEqualTypeOf<'' | 'a'>();
  });

  it('prefix parameter prepends to every extracted path', () => {
    const routes = [
      { path: 'home', component: C },
      { path: 'about', component: C },
    ] as const satisfies readonly Route[];
    expectTypeOf<ExtractRawPaths<typeof routes, 'base'>>().toEqualTypeOf<
      'base/home' | 'base/about'
    >();
  });

  it('combined mixed routes (structural + lazy + leaf + param)', () => {
    const routes = [
      { path: 'parent', children: [{ path: 'child', component: C }] },
      { path: 'leaf', component: C },
      { path: 'lazy', loadChildren: () => makePromise([{ path: 'deep', component: C }] as const) },
      { path: 'user/:id', component: C },
    ] as const satisfies readonly Route[];
    expectTypeOf<ExtractRawPaths<typeof routes>>().toEqualTypeOf<
      'parent/child' | 'leaf' | 'lazy/deep' | 'user/:id'
    >();
  });
});
