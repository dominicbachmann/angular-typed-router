import { Route } from '@angular/router';
import { ExtractRawPathsFromRoute } from './extract-raw-paths-from-route';

export type ExtractRawPathsFromRoutes<
  Routes extends readonly Route[],
  Prefix extends string = ''
> = Routes[number] extends infer R
  ? R extends Route
    ? ExtractRawPathsFromRoute<R, Prefix>
    : never
  : never;
