import plugin from '../lib/plugin';

const config = [
  {
    files: ['**/*.ts', '**/*.html'],
    plugins: {
      'angular-typed-router': plugin,
    },
    rules: {
      'angular-typed-router/no-relative-to-navigation': 'error',
      'angular-typed-router/no-trailing-slash-navigation': 'error',
      // Forbid usage of Router and RouterLink from @angular/router
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/router',
              importNames: ['Router', 'RouterLink'],
              message: 'Use TypedRouter and TypedRouterLink from angular-typed-router instead of Router and RouterLink from @angular/router',
            },
          ],
        },
      ],
    }
  }
];

export default config;
module.exports = config;
