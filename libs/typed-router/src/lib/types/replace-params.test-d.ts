import { describe, it, expectTypeOf } from 'vitest';
import type { ReplaceParams } from './replace-params';

declare module './replace-params' {
  interface RouteParamTypes {
    'replace-params': '123' | '456';
  }
}

describe('ReplaceParams', () => {
  it('leaves plain path with no params unchanged', () => {
    expectTypeOf<ReplaceParams<'plain/path'>>().toEqualTypeOf<'plain/path'>();
  });

  it('replaces single trailing param segment with never (no allowed values configured yet)', () => {
    expectTypeOf<
      ReplaceParams<'user/:not-configured'>
    >().toEqualTypeOf<never>();
  });

  it('replaces middle param segment with never (no allowed values configured yet)', () => {
    expectTypeOf<
      ReplaceParams<'user/:not-configured/details'>
    >().toEqualTypeOf<never>();
  });

  it('filters out param branch in union (never disappears)', () => {
    expectTypeOf<
      ReplaceParams<'a' | 'user/:not-configured'>
    >().toEqualTypeOf<'a'>();
  });

  it('root catch-all ** becomes branded string assignable to string', () => {
    type C = ReplaceParams<'**'>;
    expectTypeOf<C>().toExtend<string>();
    // @ts-expect-error generic string not assignable back to branded type
    const x: C = 'any';
    void x;
  });

  it('prefixed catch-all path prefix/** resolves to string (not branded)', () => {
    expectTypeOf<
      ReplaceParams<'files/**'>
    >().toEqualTypeOf<`files/${string}`>();
  });

  it('catch-all with trailing segment prefix/**/deep resolves to string', () => {
    expectTypeOf<
      ReplaceParams<'files/**/deep'>
    >().toEqualTypeOf<`files/${string}/deep`>();
  });

  it('double wildcard alone still branded', () => {
    type Root = ReplaceParams<'**'>;
    expectTypeOf<Root>().not.toEqualTypeOf<string>();
  });

  it('path without params or wildcards stays literal', () => {
    expectTypeOf<ReplaceParams<'dashboard'>>().toEqualTypeOf<'dashboard'>();
  });

  it('replaces single param with allowed literal union', () => {
    expectTypeOf<ReplaceParams<'user/:replace-params'>>().toEqualTypeOf<
      'user/123' | 'user/456'
    >();
  });

  it('replaces middle param preserving suffix', () => {
    expectTypeOf<ReplaceParams<'user/:replace-params/details'>>().toEqualTypeOf<
      'user/123/details' | 'user/456/details'
    >();
  });

  it('multi param path expands to cartesian product', () => {
    expectTypeOf<
      ReplaceParams<'order/:replace-params/items/:replace-params'>
    >().toEqualTypeOf<
      | 'order/123/items/123'
      | 'order/123/items/456'
      | 'order/456/items/123'
      | 'order/456/items/456'
    >();
  });

  it('union including param path expands correctly', () => {
    expectTypeOf<ReplaceParams<'a' | 'user/:replace-params'>>().toEqualTypeOf<
      'a' | 'user/123' | 'user/456'
    >();
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
    expectTypeOf<
      ReplaceParams<'files/**'>
    >().toEqualTypeOf<`files/${string}`>();
  });

  it('become never when no type for param is defined', () => {
    expectTypeOf<ReplaceParams<'files/:notSet'>>().toEqualTypeOf<never>();
  });
});
