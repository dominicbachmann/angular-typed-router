/**
 * Augmentation target for declaring concrete value types per route parameter
 * name. Consumers augment via `'angular-typed-router'`:
 *
 *   declare module 'angular-typed-router' {
 *     interface RouteParamTypes {
 *       'org-id': OrgId;
 *       'project-id': ProjectId;
 *     }
 *   }
 *
 * Each key matches a `:paramName` segment in the consumer's Routes; each value
 * is the type that the param resolves to in `Path` and `Commands`.
 */
export interface RouteParamTypes {}

declare const __rootCatchAll: unique symbol;

/**
 * Brand for the bare-root `**` catch-all path. Distinguishes a route declared
 * as `path: '**'` (matches anything from the root) from an arbitrary `string`.
 */
export type RootCatchAll = string & { readonly [__rootCatchAll]: true };
