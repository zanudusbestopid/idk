# Games & projects

One repo, many projects. Each project lives in its own folder under `games/` and is an npm workspace
with its own `package.json`, source, tests and build.

| Project | What it is |
| --- | --- |
| [`games/paper-tycoon`](games/paper-tycoon) | Paper-craft property-trading board game (single player + online) |

## Working on one project

```
npm install                          # once, at the repo root (installs every workspace)
npm test -w games/paper-tycoon       # run one project's tests
npm run build -w games/paper-tycoon  # build one project
npm test                             # or run a script across all projects
```

Or `cd games/<name>` and use the project's own README.

## Adding a project

1. Create `games/<name>/` with its own `package.json` (the `name` should be unique).
2. Add whatever scripts it needs (`build`, `test`, `typecheck`); the root scripts run them if present.
3. Add a row to the table above.

Tip: open a separate session per project and keep the working folder at `games/<name>`
to keep memory use small.
