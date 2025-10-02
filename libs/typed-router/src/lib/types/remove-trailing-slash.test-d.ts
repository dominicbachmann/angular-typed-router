import { describe, it, expectTypeOf } from 'vitest';
import type { RemoveTrailingSlash } from './remove-trailing-slash';

describe('RemoveTrailingSlash', () => {
  it('keeps single root slash as /', () => {
    expectTypeOf<RemoveTrailingSlash<'/'>>().toEqualTypeOf<'/'>();
  });

  it('keeps path without trailing slash unchanged', () => {
    expectTypeOf<RemoveTrailingSlash<'abc'>>().toEqualTypeOf<'abc'>();
  });

  it('removes one trailing slash', () => {
    expectTypeOf<RemoveTrailingSlash<'abc/'>>().toEqualTypeOf<'abc'>();
  });

  it('recursively removes multiple trailing slashes from non-root path', () => {
    expectTypeOf<RemoveTrailingSlash<'abc///'>>().toEqualTypeOf<'abc'>();
  });

  it('collapses multiple trailing slashes of root to single slash', () => {
    expectTypeOf<RemoveTrailingSlash<'///'>>().toEqualTypeOf<'/'>();
  });

  it('removes only trailing slash leaving internal double slashes', () => {
    expectTypeOf<RemoveTrailingSlash<'a//b/'>>().toEqualTypeOf<'a//b'>();
  });

  it('empty string stays empty', () => {
    expectTypeOf<RemoveTrailingSlash<''>>().toEqualTypeOf<''>();
  });

  it('distributes over union', () => {
    expectTypeOf<RemoveTrailingSlash<'a/' | 'b'>>().toEqualTypeOf<'a' | 'b'>();
  });

  it('widened string remains string', () => {
    expectTypeOf<RemoveTrailingSlash<string>>().toEqualTypeOf<string>();
  });
});

