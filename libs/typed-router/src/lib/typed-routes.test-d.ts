import { describe, it, expectTypeOf } from 'vitest';
import type { Route, Routes } from '@angular/router';
import type { Path, Commands } from './typed-routes';

class C {}
const lazyChildren = [{ path: 'sub', component: C }] as const satisfies Routes;

declare const __orgId: unique symbol;
declare const __projectId: unique symbol;
type OrgId = string & { readonly [__orgId]: true };
type ProjectId = string & { readonly [__projectId]: true };

const orgId = (id: string): OrgId => id as OrgId;
const projectId = (id: string): ProjectId => id as ProjectId;

const routes = [
  { path: '', component: C },
  { path: 'home', component: C },
  { path: 'about', component: C },
  { path: 'parent', component: C, children: [{ path: 'child', component: C }] },
  {
    path: 'lazy',
    loadChildren: () => Promise.resolve(lazyChildren).then((m) => m),
  },
  { path: 'redirect', redirectTo: 'home', pathMatch: 'full' },
  { path: 'struct', children: [{ path: 'leaf', component: C }] },
  { path: 'user/:typed-routes', component: C },
  { path: 'org/:org-id/project/:project-id', component: C },
  { path: 'blog/:unknown-param', component: C },
] as const satisfies readonly Route[];

declare module './types/route-param-types' {
  interface RouteParamTypes {
    'typed-routes': '123' | '456';
    'org-id': OrgId;
    'project-id': ProjectId;
  }
}
declare module './typed-routes' {
  interface UserTypedRoutes {
    routes: typeof routes;
  }
}

describe('typed-routes augmented (with param values)', () => {
  type ExpectedLiteralPath =
    | '/'
    | '/home'
    | '/about'
    | '/parent'
    | '/parent/child'
    | '/lazy/sub'
    | '/redirect'
    | '/struct/leaf'
    | '/user/123'
    | '/user/456';

  it('Path includes all literal-only routes', () => {
    type LiteralPaths = Extract<Path, ExpectedLiteralPath>;
    expectTypeOf<LiteralPaths>().toEqualTypeOf<ExpectedLiteralPath>();
  });

  it('Path includes both expanded param variants', () => {
    type UserPaths = Extract<Path, '/user/123' | '/user/456'>;
    expectTypeOf<UserPaths>().toEqualTypeOf<'/user/123' | '/user/456'>();
  });

  it('Path does not include raw colon param form', () => {
    type Raw = Extract<Path, '/user/:id'>;
    expectTypeOf<Raw>().toEqualTypeOf<never>();
  });

  type ExpectedLiteralCommands =
    | readonly ['/']
    | readonly ['/', 'home']
    | readonly ['/', 'about']
    | readonly ['/', 'parent']
    | readonly ['/', 'parent', 'child']
    | readonly ['/', 'lazy', 'sub']
    | readonly ['/', 'redirect']
    | readonly ['/', 'struct', 'leaf']
    | readonly ['/', 'user', '123']
    | readonly ['/', 'user', '456'];

  it('Commands includes all literal-only tuple variants', () => {
    type LiteralCommands = Extract<Commands, ExpectedLiteralCommands>;
    expectTypeOf<LiteralCommands>().toEqualTypeOf<ExpectedLiteralCommands>();
  });

  it('Commands tuples all start with /', () => {
    type AllValid = Commands extends readonly ['/', ...any[]] ? true : false;
    expectTypeOf<AllValid>().toEqualTypeOf<true>();
  });
});

describe('typed-routes branded param types', () => {
  it('Commands carries the branded type at each param slot', () => {
    type BrandedCommand = Extract<
      Commands,
      readonly ['/', 'org', any, 'project', any]
    >;
    expectTypeOf<BrandedCommand>().toEqualTypeOf<
      readonly ['/', 'org', OrgId, 'project', ProjectId]
    >();
  });

  it('accepts a tuple built from brand constructors', () => {
    const cmd: Commands = [
      '/',
      'org',
      orgId('acme'),
      'project',
      projectId('demo'),
    ];
    void cmd;
  });

  it('rejects raw strings in the org-id / project-id slots', () => {
    // @ts-expect-error — raw 'acme' is not assignable to OrgId
    const cmd1: Commands = ['/', 'org', 'acme', 'project', projectId('demo')];
    // @ts-expect-error — raw 'demo' is not assignable to ProjectId
    const cmd2: Commands = ['/', 'org', orgId('acme'), 'project', 'demo'];
    void cmd1;
    void cmd2;
  });

  it('rejects swapped brands (positional safety)', () => {
    // @ts-expect-error — ProjectId is not assignable to OrgId at slot 2
    const cmd: Commands = ['/', 'org', projectId('wrong'), 'project', orgId('wrong')];
    void cmd;
  });
});

describe('typed-routes branded param types in Path (string form)', () => {
  it('Path includes the branded template-literal form', () => {
    type BrandedPath = Extract<Path, `/org/${OrgId}/project/${ProjectId}`>;
    expectTypeOf<BrandedPath>().toEqualTypeOf<`/org/${OrgId}/project/${ProjectId}`>();
  });

  it('accepts a Path built from brand constructors', () => {
    const url: Path = `/org/${orgId('acme')}/project/${projectId('demo')}`;
    void url;
  });

  it('rejects raw strings in branded slots', () => {
    // @ts-expect-error — 'acme' is not assignable to OrgId
    const url1: Path = `/org/acme/project/${projectId('demo')}`;
    // @ts-expect-error — 'demo' is not assignable to ProjectId
    const url2: Path = `/org/${orgId('acme')}/project/demo`;
    void url1;
    void url2;
  });

  it('rejects swapped brands (positional safety)', () => {
    // @ts-expect-error — ProjectId is not assignable to OrgId at slot 2
    const url: Path = `/org/${projectId('wrong')}/project/${orgId('wrong')}`;
    void url;
  });
});

describe('typed-routes undeclared :param drops the route', () => {
  it('Path does not include the route containing an undeclared :param', () => {
    type Hit = Extract<Path, `/blog/${string}`>;
    expectTypeOf<Hit>().toEqualTypeOf<never>();
  });

  it('Commands has no tuple matching ["/", "blog", ...] for an undeclared :param route', () => {
    type Hit = Extract<Commands, readonly ['/', 'blog', any]>;
    expectTypeOf<Hit>().toEqualTypeOf<never>();
  });
});
