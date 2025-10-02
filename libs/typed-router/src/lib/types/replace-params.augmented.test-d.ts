import { describe, it, expectTypeOf } from 'vitest';
import type { ReplaceParams } from './replace-params';

// Module augmentation supplying concrete allowed param values
declare module './replace-params' {
  interface AllowedRouteParamValues {
    id: '123' | '456';
  }
}

describe('ReplaceParams (with augmentation)', () => {
  it('replaces single param with allowed literal union', () => {
    expectTypeOf<ReplaceParams<'user/:id'>>().toEqualTypeOf<'user/123' | 'user/456'>();
  });

  it('replaces middle param preserving suffix', () => {
    expectTypeOf<ReplaceParams<'user/:id/details'>>().toEqualTypeOf<'user/123/details' | 'user/456/details'>();
  });

  it('multi param path expands to cartesian product', () => {
    expectTypeOf<ReplaceParams<'order/:id/items/:id'>>()
      .toEqualTypeOf<
        | 'order/123/items/123'
        | 'order/123/items/456'
        | 'order/456/items/123'
        | 'order/456/items/456'
      >();
  });

  it('union including param path expands correctly', () => {
    expectTypeOf<ReplaceParams<'a' | 'user/:id'>>()
      .toEqualTypeOf<'a' | 'user/123' | 'user/456'>();
  });

  it('non-param path unchanged', () => {
    expectTypeOf<ReplaceParams<'dashboard'>>().toEqualTypeOf<'dashboard'>();
  });

  it('catch-all still behaves the same (branded root)', () => {
    type Root = ReplaceParams<'**'>;
    expectTypeOf<Root>().toExtend<string>();
    // @ts-expect-error ensure branding prevents plain string assignment
    const bad: Root = 'anything';
    void bad;
  });

  it('prefixed catch-all unaffected by augmentation', () => {
    expectTypeOf<ReplaceParams<'files/**'>>().toEqualTypeOf<`files/${string}`>();
  });
});

