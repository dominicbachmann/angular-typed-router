# angular-typed-router-eslint

ESLint rules that complement [`angular-typed-router`](../typed-router/README.md) by forbidding patterns that bypass its type safety.

## Installation

```bash
npm install --save-dev angular-typed-router-eslint
# or
pnpm add -D angular-typed-router-eslint
# or
yarn add -D angular-typed-router-eslint
```

## Setup (flat config)

The package ships a ready-to-use flat config that registers the plugin and enables all rules:

```js
// eslint.config.js
import typedRouter from 'angular-typed-router-eslint/configs/flat-config';

export default [
  // ...your other configs
  ...typedRouter,
];
```

Or wire it up manually if you want to pick rules individually:

```js
// eslint.config.js
import typedRouterPlugin from 'angular-typed-router-eslint';

export default [
  {
    files: ['**/*.ts', '**/*.html'],
    plugins: { 'angular-typed-router': typedRouterPlugin },
    rules: {
      'angular-typed-router/no-relative-to-navigation': 'error',
      'angular-typed-router/no-trailing-slash-navigation': 'error',
      // Forbid the untyped Router / RouterLink so contributors can't bypass the typed APIs
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/router',
              importNames: ['Router', 'RouterLink'],
              message: 'Use TypedRouter and TypedRouterLink from angular-typed-router instead.',
            },
          ],
        },
      ],
    },
  },
];
```

## What you get

| Rule                                                | What it does                                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `angular-typed-router/no-relative-to-navigation`    | Disallows `relativeTo` in `navigate` / `navigateByUrl` / `createUrlTree` calls. Typed paths and commands are absolute. |
| `angular-typed-router/no-trailing-slash-navigation` | Disallows trailing slashes in `routerLink` attributes and `navigateByUrl` string arguments (auto-fixable).            |
| `no-restricted-imports` (built-in, preconfigured)   | Forbids importing `Router` and `RouterLink` from `@angular/router` so contributors can't bypass `TypedRouter` / `TypedRouterLink`. |
