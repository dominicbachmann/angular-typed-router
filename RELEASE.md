# Release Guide

How to release `angular-typed-router` and `angular-typed-router-eslint`. Both packages
are versioned together (fixed relationship) and published from `dist/` via `nx release`.

## Prerequisites

- Clean working tree, all changes committed on `main`.
- Logged in to npm (`npm whoami`) as an owner of both packages.
- npm 2FA is set to `auth-and-writes`, so publishing requires an OTP.

## 1. Pick the version bump

Semver applies to consumers, not just code — changes to peer dependency ranges can be
breaking even without API changes. Pass the specifier (`major`/`minor`/`patch`)
explicitly; conventional-commit inference won't derive it from `chore:`-typed commits.

## 2. Version, changelog, commit, tag

```sh
# Preview first (no mutations)
npx nx release <specifier> --dry-run

# The real thing: builds all projects, bumps both package.jsons (source + dist),
# extends CHANGELOG.md, creates the "chore(release): publish x.y.z" commit
# and the annotated vx.y.z tag
npx nx release <specifier> --skip-publish
```

## 3. Fix up the changelog (if needed)

`chore:` commits are excluded from changelog generation, so a release without `feat:`
or `fix:` commits produces an empty "version bump only" entry. If that happens, edit
`CHANGELOG.md` in the style of the previous entries, then fold it into the release
commit and re-point the tag:

```sh
git add CHANGELOG.md
git commit --amend --no-edit
git tag -fa vx.y.z -m "vx.y.z"   # -a matters: keep the tag annotated (see step 5)
```

## 4. Publish to npm

```sh
npx nx release publish --otp=<code>
```

## 5. Push commit and tag

```sh
git push --follow-tags
```

`--follow-tags` only pushes **annotated** tags. A lightweight tag is silently skipped —
push it explicitly with `git push origin vx.y.z`.

## 6. Verify

```sh
npm view angular-typed-router version
npm view angular-typed-router-eslint version
git ls-remote --tags origin | grep vx.y.z
```
