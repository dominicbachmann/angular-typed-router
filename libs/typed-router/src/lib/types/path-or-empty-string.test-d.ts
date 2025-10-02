import { describe, it, expectTypeOf } from 'vitest';
import type { Route } from '@angular/router';
import type { PathOrEmptyString } from './path-or-empty-string';

describe('PathOrEmptyString', () => {
  it('yields literal path when present', () => {
    const r = { path: 'home' } as const satisfies Route;
    expectTypeOf<PathOrEmptyString<typeof r>>().toEqualTypeOf<'home'>();
  });

  it('yields empty string literal when path is empty string', () => {
    const r = { path: '' } as const satisfies Route;
    expectTypeOf<PathOrEmptyString<typeof r>>().toEqualTypeOf<''>();
  });

  it('yields empty string when path is absent', () => {
    const r = { loadChildren: () => Promise.resolve([]) } as const satisfies Route;
    expectTypeOf<PathOrEmptyString<typeof r>>().toEqualTypeOf<''>();
  });

  it('yields string when path is widened string', () => {
    const dyn: string = 'a';
    const r = { path: dyn } satisfies Route;
    expectTypeOf<PathOrEmptyString<typeof r>>().toEqualTypeOf<string>();
  });

  it('union of two literal paths keeps their union', () => {
    const r1 = { path: 'a' } as const satisfies Route;
    const r2 = { path: 'b' } as const satisfies Route;
    type U = typeof r1 | typeof r2;
    expectTypeOf<PathOrEmptyString<U>>().toEqualTypeOf<'a' | 'b'>();
  });

  it('union of route with path and route without path collapses to empty string (current behavior, maybe have to rethink this)', () => {
    const withPath = { path: 'x' } as const satisfies Route;
    const noPath = { children: [] } as const satisfies Route;
    type U = typeof withPath | typeof noPath;
    expectTypeOf<PathOrEmptyString<U>>().toEqualTypeOf<''>();
  });

  it('union including widened string path yields string', () => {
    const literal = { path: 'y' } as const satisfies Route;
    const widened = { path: '' } satisfies Route;
    type U = typeof literal | typeof widened;
    expectTypeOf<PathOrEmptyString<U>>().toEqualTypeOf<string>();
  });
});

