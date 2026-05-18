/**
 * Strips a trailing `/` from a string, with one exception: a bare `'/'` (the
 * root URL) is preserved.
 *
 * @example
 *   RemoveTrailingSlash<'/home/'>   // '/home'
 *   RemoveTrailingSlash<'/'>        // '/'
 *   RemoveTrailingSlash<'/home'>    // '/home'
 */
export type RemoveTrailingSlash<S extends string> = S extends '/'
  ? S
  : S extends `${infer T}/`
    ? RemoveTrailingSlash<T>
    : S;
