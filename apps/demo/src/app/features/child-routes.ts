import { Routes } from '@angular/router';

export const routes = [
  {
    path: 'lazy-child',
    loadComponent: () => import('./lazy-child').then(m => m.LazyChild),
  }
] as const satisfies Routes;
