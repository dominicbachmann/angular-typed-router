/**
 * Joins two path segments with `/`, treating an empty segment as a no-op.
 * Prevents leading/trailing/double slashes when a route has no path or sits
 * at the root.
 *
 * @example
 *   JoinPathSegments<'a', 'b'>   // 'a/b'
 *   JoinPathSegments<'', 'b'>    // 'b'
 *   JoinPathSegments<'a', ''>    // 'a'
 *   JoinPathSegments<'', ''>     // ''
 */
export type JoinPathSegments<A extends string, B extends string> = A extends ''
  ? B
  : B extends ''
    ? A
    : `${A}/${B}`;
