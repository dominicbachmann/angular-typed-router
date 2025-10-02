import { describe, it, expectTypeOf } from 'vitest';
import type { PathToTuple } from './path-to-tuple';

describe('PathToTuple', () => {
  it('empty string yields empty tuple', () => {
    expectTypeOf<PathToTuple<''>>().toEqualTypeOf<[]>();
  });

  it('single segment yields single-element tuple', () => {
    expectTypeOf<PathToTuple<'a'>>().toEqualTypeOf<['a']>();
  });

  it('two segments split correctly', () => {
    expectTypeOf<PathToTuple<'a/b'>>().toEqualTypeOf<['a','b']>();
  });

  it('three segments split correctly', () => {
    expectTypeOf<PathToTuple<'a/b/c'>>().toEqualTypeOf<['a','b','c']>();
  });

  it('trailing slash is ignored (no empty last segment)', () => {
    expectTypeOf<PathToTuple<'a/'>>().toEqualTypeOf<['a']>();
  });

  it('parameter segment kept literally', () => {
    expectTypeOf<PathToTuple<'user/:id/details'>>().toEqualTypeOf<['user',':id','details']>();
  });

  it('union of paths yields union of tuples', () => {
    type U = PathToTuple<'a' | 'b/c'>;
    expectTypeOf<U>().toEqualTypeOf<['a'] | ['b','c']>();
  });

  it('consecutive slashes preserve empty segment in the middle', () => {
    expectTypeOf<PathToTuple<'a//b'>>().toEqualTypeOf<['a','', 'b']>();
  });
});

