import { Route } from '@angular/router';
import { ExtractRawPaths } from './types/extract-raw-paths';
import { RawPathToUrl } from './types/raw-path-to-url';
import { RawPathToCommands } from './types/raw-path-to-commands';
import { RemoveTrailingSlash } from './types/remove-trailing-slash';

/** Augmentation target. Consumers declare their routes here:
 *  `declare module 'angular-typed-router' { interface UserTypedRoutes { routes: typeof routes } }` */
export interface UserTypedRoutes {}

type ProvidedRoutes = UserTypedRoutes extends { routes: readonly Route[] }
  ? UserTypedRoutes['routes']
  : [];

type RawPaths = ExtractRawPaths<ProvidedRoutes>;

export type Path = RemoveTrailingSlash<`/${RawPathToUrl<RawPaths>}`>;

export type Commands = readonly ['/', ...RawPathToCommands<RawPaths>];
