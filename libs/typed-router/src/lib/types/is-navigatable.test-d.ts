import { describe, it, expectTypeOf } from 'vitest';
import type { Route } from '@angular/router';
import type { IsNavigable } from './is-navigatable';

// Helper no-op component placeholder
class DummyComponent {}

describe('IsNavigable', () => {
  it('is true for a route with component', () => {
    const r = { path: 'cmp', component: DummyComponent } as const satisfies Route;
    expectTypeOf<IsNavigable<typeof r>>().toEqualTypeOf<true>();
  });

  it('is true for a route with loadComponent', () => {
    const r = { path: 'lazy', loadComponent: () => Promise.resolve(DummyComponent) } as const satisfies Route;
    expectTypeOf<IsNavigable<typeof r>>().toEqualTypeOf<true>();
  });

  it('is true for a redirect route', () => {
    const r = { path: '', redirectTo: 'home', pathMatch: 'full' } as const satisfies Route;
    expectTypeOf<IsNavigable<typeof r>>().toEqualTypeOf<true>();
  });

  it('is false for a structural / grouping route (children only)', () => {
    const r = { path: 'group', children: [] } as const satisfies Route;
    expectTypeOf<IsNavigable<typeof r>>().toEqualTypeOf<false>();
  });

  it('is false for a plain path-only route without component/loadComponent/redirect', () => {
    const r = { path: 'plain' } as const satisfies Route;
    expectTypeOf<IsNavigable<typeof r>>().toEqualTypeOf<false>();
  });

  it('still true if multiple navigability properties exist', () => {
    const r = { path: 'both', component: DummyComponent, redirectTo: 'x' } as const satisfies Route;
    expectTypeOf<IsNavigable<typeof r>>().toEqualTypeOf<true>();
  });
});

