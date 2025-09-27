declare const __rootCatchAll: unique symbol;
type RootCatchAll = string & { readonly [__rootCatchAll]: true };

// Something like this would be fantastic, but it's not possible in TS yet and just resolves to string:
type AllowedRouteParamValue<S extends string> = Exclude<S, '' | `${string}/${string}`>;

type _ReplaceParams<S extends string> =
  S extends `${infer Start}:${string}/${infer Rest}`
    ? `${Start}${AllowedRouteParamValue<string>}/${_ReplaceParams<Rest>}`
    : S extends `${infer Start}:${string}`
      ? `${Start}${AllowedRouteParamValue<string>}`
      : S extends `${infer Start}**/${infer Rest}`
        ? `${Start}${string}/${_ReplaceParams<Rest>}`
        : S extends `${infer Start}**`
          ? Start extends ''
            ? RootCatchAll
            : `${Start}${string}`
          : S;

export type ReplaceParams<S extends string> = _ReplaceParams<S>;
