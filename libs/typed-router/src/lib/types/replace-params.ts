declare const __rootCatchAll: unique symbol;
type RootCatchAll = string & { readonly [__rootCatchAll]: true };

export interface RouteParamTypes {}

type ParamValueType<Name extends string> = Name extends keyof RouteParamTypes
  ? RouteParamTypes[Name]
  : never;

type _ReplaceParams<S extends string> =
  S extends `${infer Start}:${infer Param}/${infer Rest}`
    ? `${Start}${ParamValueType<Param>}/${_ReplaceParams<Rest>}`
    : S extends `${infer Start}:${infer Param}`
    ? `${Start}${ParamValueType<Param>}`
    : S extends `${infer Start}**/${infer Rest}`
    ? `${Start}${string}/${_ReplaceParams<Rest>}`
    : S extends `${infer Start}**`
    ? Start extends ''
      ? RootCatchAll
      : `${Start}${string}`
    : S;

export type ReplaceParams<S extends string> = _ReplaceParams<S>;

export type ExtractParamNames<T extends string> =
  T extends `${infer Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractParamNames<Rest>
    : T extends `${infer Start}:${infer Param}`
    ? Param
    : never;

export type PathParams<T extends string> = {
  [K in ExtractParamNames<T>]: K extends keyof RouteParamTypes
    ? RouteParamTypes[K]
    : string;
};
