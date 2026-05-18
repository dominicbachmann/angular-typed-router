import { describe, it, expectTypeOf } from 'vitest';
import type { RawPathToUrl } from './raw-path-to-url';

declare module './route-param-types' {
  interface RouteParamTypes {
    'replace-params': '123' | '456';
  }
}

describe('RawPathToUrl', () => {
  it('leaves plain path with no params unchanged', () => {
    expectTypeOf<RawPathToUrl<'plain/path'>>().toEqualTypeOf<'plain/path'>();
  });

  it('replaces single trailing param segment with never (no allowed values configured yet)', () => {
    expectTypeOf<
      RawPathToUrl<'user/:not-configured'>
    >().toEqualTypeOf<never>();
  });

  it('replaces middle param segment with never (no allowed values configured yet)', () => {
    expectTypeOf<
      RawPathToUrl<'user/:not-configured/details'>
    >().toEqualTypeOf<never>();
  });

  it('filters out param branch in union (never disappears)', () => {
    expectTypeOf<
      RawPathToUrl<'a' | 'user/:not-configured'>
    >().toEqualTypeOf<'a'>();
  });

  it('root catch-all ** becomes branded string assignable to string', () => {
    type C = RawPathToUrl<'**'>;
    expectTypeOf<C>().toExtend<string>();
    // @ts-expect-error generic string not assignable back to branded type
    const x: C = 'any';
    void x;
  });

  it('prefixed catch-all path prefix/** resolves to string (not branded)', () => {
    expectTypeOf<
      RawPathToUrl<'files/**'>
    >().toEqualTypeOf<`files/${string}`>();
  });

  it('catch-all with trailing segment prefix/**/deep resolves to string', () => {
    expectTypeOf<
      RawPathToUrl<'files/**/deep'>
    >().toEqualTypeOf<`files/${string}/deep`>();
  });

  it('double wildcard alone still branded', () => {
    type Root = RawPathToUrl<'**'>;
    expectTypeOf<Root>().not.toEqualTypeOf<string>();
  });

  it('path without params or wildcards stays literal', () => {
    expectTypeOf<RawPathToUrl<'dashboard'>>().toEqualTypeOf<'dashboard'>();
  });

  it('replaces single param with allowed literal union', () => {
    expectTypeOf<RawPathToUrl<'user/:replace-params'>>().toEqualTypeOf<
      'user/123' | 'user/456'
    >();
  });

  it('replaces middle param preserving suffix', () => {
    expectTypeOf<RawPathToUrl<'user/:replace-params/details'>>().toEqualTypeOf<
      'user/123/details' | 'user/456/details'
    >();
  });

  it('multi param path expands to cartesian product', () => {
    expectTypeOf<
      RawPathToUrl<'order/:replace-params/items/:replace-params'>
    >().toEqualTypeOf<
      | 'order/123/items/123'
      | 'order/123/items/456'
      | 'order/456/items/123'
      | 'order/456/items/456'
    >();
  });

  it('union including param path expands correctly', () => {
    expectTypeOf<RawPathToUrl<'a' | 'user/:replace-params'>>().toEqualTypeOf<
      'a' | 'user/123' | 'user/456'
    >();
  });

  it('non-param path unchanged', () => {
    expectTypeOf<RawPathToUrl<'dashboard'>>().toEqualTypeOf<'dashboard'>();
  });

  it('catch-all still behaves the same (branded root)', () => {
    type Root = RawPathToUrl<'**'>;
    expectTypeOf<Root>().toExtend<string>();
    // @ts-expect-error ensure branding prevents plain string assignment
    const bad: Root = 'anything';
    void bad;
  });

  it('prefixed catch-all unaffected by augmentation', () => {
    expectTypeOf<
      RawPathToUrl<'files/**'>
    >().toEqualTypeOf<`files/${string}`>();
  });

  it('become never when no type for param is defined', () => {
    expectTypeOf<RawPathToUrl<'files/:notSet'>>().toEqualTypeOf<never>();
  });
});
