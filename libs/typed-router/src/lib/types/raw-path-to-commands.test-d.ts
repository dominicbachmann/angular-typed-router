import { describe, it, expectTypeOf } from 'vitest';
import type { RawPathToCommands } from './raw-path-to-commands';

declare const __pctOrg: unique symbol;
declare const __pctProject: unique symbol;
type PctOrgId = string & { readonly [__pctOrg]: true };
type PctProjectId = string & { readonly [__pctProject]: true };

declare module './route-param-types' {
  interface RouteParamTypes {
    'pct-literal': '123' | '456';
    'pct-org': PctOrgId;
    'pct-project': PctProjectId;
    'pct-num': number;
  }
}

describe('RawPathToCommands', () => {
  it('empty string yields empty tuple', () => {
    expectTypeOf<RawPathToCommands<''>>().toEqualTypeOf<[]>();
  });

  it('single literal segment yields single-element tuple', () => {
    expectTypeOf<RawPathToCommands<'a'>>().toEqualTypeOf<['a']>();
  });

  it('two literal segments split correctly', () => {
    expectTypeOf<RawPathToCommands<'a/b'>>().toEqualTypeOf<['a', 'b']>();
  });

  it('three literal segments split correctly', () => {
    expectTypeOf<RawPathToCommands<'a/b/c'>>().toEqualTypeOf<['a', 'b', 'c']>();
  });

  it(':paramName segment resolves to RouteParamTypes value (literal union)', () => {
    expectTypeOf<RawPathToCommands<'user/:pct-literal'>>().toEqualTypeOf<
      ['user', '123'] | ['user', '456']
    >();
  });

  it('multiple :paramName segments produce a Cartesian product of tuples', () => {
    expectTypeOf<RawPathToCommands<'a/:pct-literal/b/:pct-literal'>>().toEqualTypeOf<
      | ['a', '123', 'b', '123']
      | ['a', '123', 'b', '456']
      | ['a', '456', 'b', '123']
      | ['a', '456', 'b', '456']
    >();
  });

  it('branded RouteParamTypes value is preserved (not collapsed to string)', () => {
    expectTypeOf<RawPathToCommands<'org/:pct-org'>>().toEqualTypeOf<
      ['org', PctOrgId]
    >();
  });

  it('two different brands stay positionally distinct', () => {
    expectTypeOf<RawPathToCommands<'org/:pct-org/project/:pct-project'>>().toEqualTypeOf<
      ['org', PctOrgId, 'project', PctProjectId]
    >();
  });

  it('numeric RouteParamTypes value is preserved', () => {
    expectTypeOf<RawPathToCommands<'item/:pct-num'>>().toEqualTypeOf<
      ['item', number]
    >();
    expectTypeOf<RawPathToCommands<'item/:pct-num/edit'>>().toEqualTypeOf<
      ['item', number, 'edit']
    >();
  });

  it('unrecognized :paramName resolves to never (route drops)', () => {
    expectTypeOf<RawPathToCommands<'x/:not-configured'>>().toEqualTypeOf<never>();
  });

  it('unrecognized :paramName in a middle segment also drops the whole tuple', () => {
    expectTypeOf<RawPathToCommands<'x/:not-configured/y'>>().toEqualTypeOf<never>();
  });

  it('union of input paths distributes over the tuple result', () => {
    expectTypeOf<RawPathToCommands<'a' | 'b/c'>>().toEqualTypeOf<['a'] | ['b', 'c']>();
  });
});
