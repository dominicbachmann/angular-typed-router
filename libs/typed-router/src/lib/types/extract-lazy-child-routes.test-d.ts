import { expectTypeOf, describe, it } from 'vitest';
import type { Route, Routes } from '@angular/router';
import type { ExtractLazyChildRoutes } from './extract-lazy-child-routes';

const makePromise = <T>(v: T) => Promise.resolve(v);

describe('ExtractLazyChildRoutes', () => {
  it('extracts routes when loadChildren returns Promise<Route[]>', () => {
    const childRoutes = [{ path: 'a' } satisfies Route];
    const lazy = {
      path: 'lazy',
      loadChildren: () => makePromise(childRoutes),
    } as const satisfies Route;

    expectTypeOf<ExtractLazyChildRoutes<typeof lazy>>().toExtend<Route[]>();

    type Elem = ExtractLazyChildRoutes<typeof lazy>[number];
    expectTypeOf<Elem>().toExtend<Route>();
  });

  it('preserves readonly when loadChildren returns readonly Route[]', () => {
    const childRoutes = [{ path: 'b' } satisfies Route] as const satisfies Routes;
    const lazy = {
      loadChildren: () => makePromise(childRoutes),
    }  as const satisfies Route;

    expectTypeOf<ExtractLazyChildRoutes<typeof lazy>>().toExtend<readonly Route[]>();
  });

  it('extracts routes from a module object with a routes property', () => {
    const moduleLike = { routes: [{ path: 'c' } satisfies Route] as const satisfies Routes };
    const lazy = {
      loadChildren: () => makePromise(moduleLike).then(m => m.routes),
    }  as const satisfies Route;
    expectTypeOf<ExtractLazyChildRoutes<typeof lazy>>().toExtend<readonly Route[]>();
    type Elem = ExtractLazyChildRoutes<typeof lazy>[number];
    expectTypeOf<Elem>().toExtend<Route>();
  });

  it('yields empty tuple when no loadChildren is present', () => {
    const nonLazy = { path: 'root' } satisfies Route;
    expectTypeOf<ExtractLazyChildRoutes<typeof nonLazy>>().toEqualTypeOf<[]>();
  });

  it('yields empty tuple when loadChildren does not resolve to routes', () => {
    const bad = {
      // @ts-expect-error testing non-conforming return type
      loadChildren: () => makePromise({ notRoutes: true }),
    }  as const satisfies Route;
    // @ts-expect-error testing non-conforming return type
    expectTypeOf<ExtractLazyChildRoutes<typeof bad>>().toEqualTypeOf<[]>();
  });

  it('narrow module object routes array element types are preserved (no widening beyond Route)', () => {
    interface ExtraRoute extends Route { custom?: number }
    const moduleLike = { routes: [{ path: 'z', custom: 123 } satisfies ExtraRoute] };
    const lazy = {
      loadChildren: () => makePromise(moduleLike).then(m => m.routes),
    };
    type Extracted = ExtractLazyChildRoutes<typeof lazy>;
    // Element should still be assignable to Route
    expectTypeOf<Extracted[number]>().toExtend<Route>();
  });
});

