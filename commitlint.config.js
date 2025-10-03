import { defineConfig } from 'cz-git'

export default defineConfig({
  extends: ['@commitlint/config-conventional'],
  prompt: {
    scopes: [
      { value: 'typed-router' },
      { value: 'eslint-plugin' },
      { value: 'demo' },
    ],
    allowCustomScopes: true,
    allowEmptyScopes: true,
  },
})
