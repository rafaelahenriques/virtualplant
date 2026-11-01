# Contributing

This project uses [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow): `main` is always working, and every change reaches it through a pull request.

## Workflow

1. Branch from an up-to-date `main`:

   ```bash
   git switch main
   git pull
   git switch -c feature/procedural-stem
   ```

2. Commit small, focused changes and push the branch.
3. Open a pull request early, as a draft if it isn't ready.
4. Merge once CI passes, using **Squash and merge**, then delete the branch.

Never commit directly to `main`.

## Branch names

| Prefix     | Use for                                 |
| ---------- | --------------------------------------- |
| `feature/` | New behaviour, such as a roadmap phase  |
| `fix/`     | Bug fixes                               |
| `docs/`    | Documentation only                      |
| `chore/`   | Tooling, dependencies and configuration |

## Commit messages

Use a short imperative summary with a type prefix: `feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `test:` or `refactor:`.

```text
feat: generate stem curve from growth nodes
```

Commits carry no `Co-Authored-By` trailers.

## Before you push

CI runs these on every pull request:

```bash
npm run format:check
npm run lint
npm test
npm run build
```
