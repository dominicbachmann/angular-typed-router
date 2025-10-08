/**
 * Augments the angular-typed-router library with this app's route definitions.
 * Ensures Path and Commands types reflect the routes in appRoutes.
 */
import type { appRoutes } from './src/app/app.routes';

declare module 'angular-typed-router' {
  interface UserTypedRoutes {
    routes: typeof appRoutes;
  }
  interface RouteParamTypes {
    param: 'home' | 'about' | 'contact' | 'user' | 'settings';
    'other-param': 'something' | 'else';
  }
}
