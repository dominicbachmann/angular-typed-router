import { Route } from '@angular/router';
import { ExtractPathsFromRoutes } from './types/extract-paths-from-routes';
import { ReplaceParams } from './types/replace-params';
import { PathToCommandTuple } from './types/path-to-command-tuple';
import { RemoveTrailingSlash } from './types/remove-trailing-slash';

/**
 * Merge target. Consumer augments this interface:
 * declare module 'angular-typed-router' { interface UserTypedRoutes { routes: typeof routes; } }`
 */
export interface UserTypedRoutes {}

type ProvidedRoutes = UserTypedRoutes extends { routes: readonly Route[] }
  ? UserTypedRoutes['routes']
  : [];

/** Canonical intermediate: every navigable path with `:paramName` markers preserved. */
type RawPaths = ExtractPathsFromRoutes<ProvidedRoutes>;

export type Path = RemoveTrailingSlash<`/${ReplaceParams<RawPaths>}`>;

export type Commands = readonly ['/', ...PathToCommandTuple<RawPaths>];
