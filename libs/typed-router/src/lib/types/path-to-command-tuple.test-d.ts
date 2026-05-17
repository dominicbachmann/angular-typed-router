import { describe, it, expectTypeOf } from 'vitest';
import type { PathToCommandTuple } from './path-to-command-tuple';

declare const __pctOrg: unique symbol;
declare const __pctProject: unique symbol;
type PctOrgId = string & { readonly [__pctOrg]: true };
type PctProjectId = string & { readonly [__pctProject]: true };

declare module './replace-params' {
  interface RouteParamTypes {
    'pct-literal': '123' | '456';
    'pct-org': PctOrgId;
    'pct-project': PctProjectId;
  }
}

describe('PathToCommandTuple', () => {
  it('empty string yields empty tuple', () => {
    expectTypeOf<PathToCommandTuple<''>>().toEqualTypeOf<[]>();
  });

  it('single literal segment yields single-element tuple', () => {
    expectTypeOf<PathToCommandTuple<'a'>>().toEqualTypeOf<['a']>();
  });

  it('two literal segments split correctly', () => {
    expectTypeOf<PathToCommandTuple<'a/b'>>().toEqualTypeOf<['a', 'b']>();
  });

  it('three literal segments split correctly', () => {
    expectTypeOf<PathToCommandTuple<'a/b/c'>>().toEqualTypeOf<['a', 'b', 'c']>();
  });

  it(':paramName segment resolves to RouteParamTypes value (literal union)', () => {
    expectTypeOf<PathToCommandTuple<'user/:pct-literal'>>().toEqualTypeOf<
      ['user', '123'] | ['user', '456']
    >();
  });

  it('multiple :paramName segments produce a Cartesian product of tuples', () => {
    expectTypeOf<PathToCommandTuple<'a/:pct-literal/b/:pct-literal'>>().toEqualTypeOf<
      | ['a', '123', 'b', '123']
      | ['a', '123', 'b', '456']
      | ['a', '456', 'b', '123']
      | ['a', '456', 'b', '456']
    >();
  });

  it('branded RouteParamTypes value is preserved (not collapsed to string)', () => {
    expectTypeOf<PathToCommandTuple<'org/:pct-org'>>().toEqualTypeOf<
      ['org', PctOrgId]
    >();
  });

  it('two different brands stay positionally distinct', () => {
    expectTypeOf<PathToCommandTuple<'org/:pct-org/project/:pct-project'>>().toEqualTypeOf<
      ['org', PctOrgId, 'project', PctProjectId]
    >();
  });

  it('unrecognized :paramName falls back to string', () => {
    expectTypeOf<PathToCommandTuple<'x/:not-configured'>>().toEqualTypeOf<['x', string]>();
  });

  it('union of input paths distributes over the tuple result', () => {
    expectTypeOf<PathToCommandTuple<'a' | 'b/c'>>().toEqualTypeOf<['a'] | ['b', 'c']>();
  });
});
