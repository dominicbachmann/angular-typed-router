import { Route } from '@angular/router';
import { ExtractRawPathsFromRoute } from './extract-raw-paths-from-route';

/**
 * Distributes over a Routes array, emitting every navigable path with
 * `:paramName` markers intact. `Prefix` accumulates the parent path on
 * each recursion step.
 *
 * @example
 *   ExtractRawPaths<[
 *     { path: 'home', component: C },
 *     { path: 'user/:id', component: C }
 *   ]>
 *   // 'home' | 'user/:id'
 */
export type ExtractRawPaths<
  Routes extends readonly Route[],
  Prefix extends string = ''
> = Routes[number] extends infer R
  ? R extends Route
    ? ExtractRawPathsFromRoute<R, Prefix>
    : never
  : never;
