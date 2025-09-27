import { Route } from '@angular/router';
import { PathToTuple } from './types/path-to-tuple';
import { ExtractPathsFromRoutes } from './types/extract-paths-from-routes';
import { RemoveTrailingSlash } from './types/remove-trailing-slash';

/**
 * Merge target. Consumer augments this interface:
 * declare module 'angular-typed-router' { interface UserTypedRoutes { routes: typeof routes; } }`
 */
export interface UserTypedRoutes {}

type ProvidedRoutes = UserTypedRoutes extends { routes: readonly Route[] }
  ? UserTypedRoutes['routes']
  : [];

export type Path = RemoveTrailingSlash<`/${ExtractPathsFromRoutes<ProvidedRoutes>}`>;

type CommandPath = ExtractPathsFromRoutes<ProvidedRoutes>;

export type Commands = ['/', ...PathToTuple<CommandPath>];
