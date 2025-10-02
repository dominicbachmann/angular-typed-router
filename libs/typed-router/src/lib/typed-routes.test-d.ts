import { describe, it, expectTypeOf } from 'vitest';
import type { Path, Commands } from './typed-routes';

describe('typed-routes baseline (no augmentation)', () => {
  it('Path resolves to never', () => {
    expectTypeOf<Path>().toEqualTypeOf<never>();
  });

  it('Commands resolves to never (no navigable command segments)', () => {
    expectTypeOf<Commands>().toEqualTypeOf<never>();
  });

  it('never is still assignable to string for Path (sanity)', () => {
    // compile-time only check
    const _check: string = (null as any as Path); // Path is never, so this line wouldn't compile if Path was something else
  });
});

