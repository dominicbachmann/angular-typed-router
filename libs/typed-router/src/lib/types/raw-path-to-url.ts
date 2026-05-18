import { ResolveParam } from './resolve-param';
import { RootCatchAll } from './route-param-types';

/**
 * Substitutes `:paramName` markers with their resolved types, producing a
 * URL-string template-literal type. Brand types survive as type-level
 * placeholders (`/user/${UserId}`).
 *
 * @example
 *   RawPathToUrl<'user/:id'>   // `user/${UserId}` (assuming id: UserId)
 *   RawPathToUrl<'home'>       // 'home'
 *   RawPathToUrl<'**'>         // RootCatchAll
 */
export type RawPathToUrl<S extends string> =
  S extends `${infer Start}:${infer Param}/${infer Rest}`
    ? `${Start}${ResolveParam<Param>}/${RawPathToUrl<Rest>}`
    : S extends `${infer Start}:${infer Param}`
      ? `${Start}${ResolveParam<Param>}`
      : S extends `${infer Start}**/${infer Rest}`
        ? `${Start}${string}/${RawPathToUrl<Rest>}`
        : S extends `${infer Start}**`
          ? Start extends ''
            ? RootCatchAll
            : `${Start}${string}`
          : S;
