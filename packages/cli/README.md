# profil

The internal CLI for the Profil project. Provides full initialization
(`init`), static checks (`check`), resume management (`add`/`list`/`remove`),
and cleanup (`clean`). Published to npm as the unscoped `profil` package, so
`npx profil` works right away.

```bash
npx profil init            # scaffold + check in the current directory
npx profil init --home     # initialize the user data home (~/.profil) instead
npx profil init --force    # regenerate profil.config.yaml, content/resume, dist from templates
npx profil check           # static checks (also run in CI)
npx profil list [section]  # list resume entries (experience|projects|education|positions|skills)
npx profil add experience --company "ACME" --role "Engineer" --start 2024-01 \
    --end present --positions mlops,backend
npx profil add project --title "..." [--url ...] / add education / add position
npx profil remove experience/acme.md   # path is relative to content/resume
npx profil clean [--deep]  # remove build outputs (--deep: node_modules too)
```

## Data home (`~/.profil`, `~/.profil-dev` for dev builds)

When installed locally (globally), user data lives under `~/.profil/` —
`$HOME/.profil` on macOS/Linux, `%USERPROFILE%\.profil` on Windows.

**Dev builds use `~/.profil-dev/`** instead, to avoid polluting real user
data. Resolution order (`isDevBuild` in `src/paths.ts`):

1. `PROFIL_DEV` env var, if set (`0`/`false` forces release mode)
2. dev if `NODE_ENV=development`
3. dev if the package version has a prerelease tag (e.g. `0.1.0-dev.0`)

The `PROFIL_HOME` env var overrides the location outright, regardless of the
above.

Every command resolves its project root as: `--root <dir>` flag → walk up
from the current directory (looking for `profil.config.yaml`) → fall back to
the data home. In other words, it targets the repo when run from inside one,
and the data home otherwise.

`add` validates flags against the schema (zod) to build frontmatter, then
runs `check` right after writing the file. `remove` runs `check` after
deleting, so a broken wikilink is reported immediately.

## What `check` verifies

1. `profil.config.yaml` — zod schema (`src/config.ts` is the source of truth)
2. `content/resume/**/*.md` — frontmatter schema (`@profil/jari`'s `loadResumeModel`)
3. Position tag integrity — that every `positions:` tag, `weight:` key, and
   the config's `resume.positions` all match a slug in `positions/*.md`
4. Wikilink integrity — that `links:` frontmatter and inline `[[...]]` in the
   body resolve to a file under `content/`

All errors are collected and reported together; exits 1 if there are any.

## `init` safety rules

- Refuses if managed files already exist — `--force` must be passed explicitly
  to overwrite (non-interactive, no prompts)
- `--force` only touches `profil.config.yaml`, `content/resume/`, and `dist/`
- `content/notes/` (the Obsidian vault) and `content/portfolio/` are user
  data, so they are **only created if missing, never overwritten**

## Templates

`templates/` is the source of the scaffold. Edit it to change the sample
content (the repo root's `content/` is user data, not the init template).

## Packaging (bundle)

The distributed artifact is a single `dist/cli.js` — esbuild inlines
`@profil/jari`, `zod`, `gray-matter`, and everything else, so `@profil/jari`
never needs to be published separately; `profil` alone is installable and
runnable. The only external runtime dependency is `yaml` (kept in
`dependencies` and passed `--external:yaml` due to a CJS-interop issue).

```bash
npm run bundle --workspace=profil   # produces dist/cli.js (esbuild)
```

`npm publish` runs this automatically via the `prepublishOnly` hook, so manual
bundling isn't needed. The `files` field restricts the published tarball to
`dist/cli.js` and `templates/`, so `src/`, tests, and monorepo workspace
references never leak into the published package.

Verifying in full isolation (outside the monorepo):

```bash
cd packages/cli && npm pack
npm install -g ./profil-<version>.tgz
profil --version && profil init   # in a scratch directory
npm uninstall -g profil
```

## Release (propose → merge → publish)

Three workflows carry out the release:

1. **`.github/workflows/propose-release.yml`** (`workflow_dispatch`, run
   manually by a maintainer) — computes the next version (from the latest
   `v*` tag, or an explicit `version`/`bump` input), regenerates
   `CHANGELOG.md` with git-cliff, bumps every workspace `package.json`, and
   opens a PR from a **fresh `release/vX.Y.Z` branch** (one per version, not
   reused) into `main`.
2. **`.github/workflows/release.yml`** — triggers when
   `packages/cli/package.json`'s version changes on `main` (i.e. once the
   proposal PR above is merged). Tags `vX.Y.Z`, cuts a GitHub Release from the
   matching `CHANGELOG.md` section, and runs
   `npm publish --access public --provenance`.
3. **`.github/workflows/verify-release.yml`** — after a successful release,
   installs the just-published version globally in a clean environment and
   runs `profil init`/`check` as a smoke test.

Publishing requires an npm **Automation token** stored as the `NPM_TOKEN`
repo secret — this token type is designed to skip the interactive 2FA/OTP
prompt that a normal token would hit in CI. To (re)issue one:
`npmjs.com/settings/<account>/tokens` → **Generate New Token → Classic Token
→ Automation**, then `gh secret set NPM_TOKEN --repo jyje/profil`.

To cut a release: run `propose-release.yml` from the Actions tab, review the
generated PR, and merge it — the rest happens automatically.
