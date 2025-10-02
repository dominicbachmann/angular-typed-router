import { describe, it, expectTypeOf } from 'vitest';
import type { Route } from '@angular/router';
import type { ExtractPathsFromRoute } from './extract-paths-from-route';

class C {}

const makePromise = <T>(v: T) => Promise.resolve(v);

describe('ExtractPathsFromRoute', () => {
  it('single navigable leaf (component) yields its path', () => {
    const r = { path: 'home', component: C } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>().toEqualTypeOf<'home'>();
  });

  it('redirect route is navigable', () => {
    const r = { path: 'go', redirectTo: 'home', pathMatch: 'full' } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>().toEqualTypeOf<'go'>();
  });

  it('structural parent without component not included, child included', () => {
    const r = {
      path: 'parent',
      children: [
        { path: 'child', component: C },
      ],
    } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>().toEqualTypeOf<'parent/child'>();
  });

  it('parent with component AND child includes both parent and nested', () => {
    const r = {
      path: 'p',
      component: C,
      children: [ { path: 'c', component: C } ],
    } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>().toEqualTypeOf<'p' | 'p/c'>();
  });

  it('nested deeper structure accumulates segments', () => {
    const r = {
      path: 'a',
      children: [ { path: 'b', children: [ { path: 'c', component: C } ] } ],
    } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>().toEqualTypeOf<'a/b/c'>();
  });

  it('root empty path component yields empty string path', () => {
    const r = { path: '', component: C } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>().toEqualTypeOf<''>();
  });

  it('root empty structural path with child yields child path (no leading slash)', () => {
    const r = { path: '', children: [ { path: 'dash', component: C } ] } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>().toEqualTypeOf<'dash'>();
  });

  it('lazy child route paths are prefixed correctly', () => {
    const r = {
      path: 'lazy',
      loadChildren: () => makePromise([{ path: 'sub', component: C }] as const),
    } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>().toEqualTypeOf<'lazy/sub'>();
  });

  it('lazy + children + component union accumulates all', () => {
    const r = {
      path: 'mix',
      component: C,
      children: [ { path: 'child', component: C } ],
      loadChildren: () => makePromise([{ path: 'lazy', component: C }] as const),
    } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r>>()
      .toEqualTypeOf<'mix' | 'mix/child' | 'mix/lazy'>();
  });

  it('explicit prefix argument prepends to all derived paths', () => {
    const r = { path: 'home', component: C } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r, 'base'>>()
      .toEqualTypeOf<'base/home'>();
  });

  it('explicit prefix with empty path child collapses correctly', () => {
    const r = { path: '', component: C } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r, 'base'>>()
      .toEqualTypeOf<'base'>();
  });

  it('structural parent with prefix only yields descendant prefixed paths', () => {
    const r = { path: 'p', children: [ { path: 'c', component: C } ] } as const satisfies Route;
    expectTypeOf<ExtractPathsFromRoute<typeof r, 'x'>>()
      .toEqualTypeOf<'x/p/c'>();
  });
});

