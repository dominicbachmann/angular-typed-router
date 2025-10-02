import { describe, it, expectTypeOf } from 'vitest';
import type { JoinPathSegments } from './join-path-segments';

describe('JoinPathSegments', () => {
  it('returns empty string when both segments are empty', () => {
    expectTypeOf<JoinPathSegments<'', ''>>().toEqualTypeOf<''>();
  });

  it('returns second when first is empty', () => {
    expectTypeOf<JoinPathSegments<'', 'b'>>().toEqualTypeOf<'b'>();
  });

  it('returns first when second is empty', () => {
    expectTypeOf<JoinPathSegments<'a', ''>>().toEqualTypeOf<'a'>();
  });

  it('joins with slash when both non-empty', () => {
    expectTypeOf<JoinPathSegments<'a', 'b'>>().toEqualTypeOf<'a/b'>();
  });

  it('distributes over union in second segment', () => {
    expectTypeOf<JoinPathSegments<'a', '' | 'x'>>().toEqualTypeOf<'a' | 'a/x'>();
  });

  it('distributes over union in first segment', () => {
    expectTypeOf<JoinPathSegments<'' | 'a', 'x'>>().toEqualTypeOf<'x' | 'a/x'>();
  });
});

