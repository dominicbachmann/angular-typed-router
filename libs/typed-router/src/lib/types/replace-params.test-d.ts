import { describe, it, expectTypeOf } from 'vitest';
import type { ReplaceParams } from './replace-params';

describe('ReplaceParams', () => {
  it('leaves plain path with no params unchanged', () => {
    expectTypeOf<ReplaceParams<'plain/path'>>().toEqualTypeOf<'plain/path'>();
  });

  it('replaces single trailing param segment with never (no allowed values configured yet)', () => {
    expectTypeOf<ReplaceParams<'user/:id'>>().toEqualTypeOf<never>();
  });

  it('replaces middle param segment with never (no allowed values configured yet)', () => {
    expectTypeOf<ReplaceParams<'user/:id/details'>>().toEqualTypeOf<never>();
  });

  it('filters out param branch in union (never disappears)', () => {
    expectTypeOf<ReplaceParams<'a' | 'user/:id'>>().toEqualTypeOf<'a'>();
  });

  it('root catch-all ** becomes branded string assignable to string', () => {
    type C = ReplaceParams<'**'>;
    expectTypeOf<C>().toExtend<string>();
    // @ts-expect-error generic string not assignable back to branded type
    const x: C = 'any';
    void x;
  });

  it('prefixed catch-all path prefix/** resolves to string (not branded)', () => {
    expectTypeOf<ReplaceParams<'files/**'>>().toEqualTypeOf<`files/${string}`>();
  });

  it('catch-all with trailing segment prefix/**/deep resolves to string', () => {
    expectTypeOf<ReplaceParams<'files/**/deep'>>().toEqualTypeOf<`files/${string}/deep`>();
  });

  it('double wildcard alone still branded', () => {
    type Root = ReplaceParams<'**'>;
    expectTypeOf<Root>().not.toEqualTypeOf<string>();
  });

  it('path without params or wildcards stays literal', () => {
    expectTypeOf<ReplaceParams<'dashboard'>>().toEqualTypeOf<'dashboard'>();
  });
});


