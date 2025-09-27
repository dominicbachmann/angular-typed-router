type _Normalize<S extends string> = string extends S ? string : S;

export type PathToTuple<P extends string> =
  P extends `${infer Head}/${infer Rest}`
    ? [_Normalize<Head>, ...PathToTuple<Rest>]
    : P extends '' ? [] : [_Normalize<P>];
