import { Routes } from '@angular/router';
import { Page3 } from './features/page3';
import { Child } from './features/child';
import { ChildWithIntermediate } from './features/child-with-intermediate';
import { Root } from './features/root';

export const appRoutes = [
  {
    path: '',
    component: Root,
  },
  {
    path: 'page1/',
    loadComponent: () => import('./features/page1').then((m) => m.Page1),
  },
  {
    path: 'page2',
    loadComponent: () => import('./features/page2').then((m) => m.Page2),
    children: [
      {
        path: 'child',
        component: Child,
      },
    ],
  },
  {
    path: 'page3',
    component: Page3,
    loadChildren: () => import('./features/child-routes').then((m) => m.routes),
  },
  {
    path: 'intermediate',
    children: [
      {
        path: 'child',
        component: ChildWithIntermediate,
      },
    ],
  },
  {
    path: 'with-param/:param/:other-param',
    loadComponent: () =>
      import('./features/with-param').then((m) => m.WithParam),
  },
  {
    path: '**',
    redirectTo: 'page3',
  },
] as const satisfies Routes;
