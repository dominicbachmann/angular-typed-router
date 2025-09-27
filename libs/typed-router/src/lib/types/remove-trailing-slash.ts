export type RemoveTrailingSlash<S extends string> = S extends '/' ? S : S extends `${infer T}/` ? RemoveTrailingSlash<T> : S;
