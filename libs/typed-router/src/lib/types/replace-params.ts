declare const __rootCatchAll: unique symbol;
type RootCatchAll = string & { readonly [__rootCatchAll]: true };

export interface AllowedRouteParamValues { }

type AllowedRouteParamValue = AllowedRouteParamValues[keyof AllowedRouteParamValues];

type _ReplaceParams<S extends string> =
  S extends `${infer Start}:${string}/${infer Rest}`
    ? `${Start}${AllowedRouteParamValue}/${_ReplaceParams<Rest>}`
    : S extends `${infer Start}:${string}`
      ? `${Start}${AllowedRouteParamValue}`
      : S extends `${infer Start}**/${infer Rest}`
        ? `${Start}${string}/${_ReplaceParams<Rest>}`
        : S extends `${infer Start}**`
          ? Start extends ''
            ? RootCatchAll
            : `${Start}${string}`
          : S;

export type ReplaceParams<S extends string> = _ReplaceParams<S>;
