# Figurant Management

This branch contains the plain-JavaScript React foundation for the Frontier
Figurant Manager. The current interface is a read-only API workbench: it makes
the data boundary visible and testable before the complete SL and figuhok
workflows are rebuilt.

The previous Svelte application remains available in Git history and on the
original branch.

## Requirements

- Node.js `20.19+` or `22.12+`
- npm

## Start with fictional mock data

```sh
npm install
npm run dev
```

Mock mode is the default and needs no external services or credentials. The
fixtures cover prepared, assigned, activated and recurring character states.

Useful commands:

```sh
npm test
npm run build
npm run preview
```

## Use the live Orthanc development API

Copy `.env.example` to `.env.local` and set:

```dotenv
ORTHANC_BASE_URL=https://example.invalid/orthanc/v2/
ORTHANC_API_TOKEN=replace-me
VITE_DATA_SOURCE=live
VITE_ORTHANC_FIGURANT_GROUP_NAME=monsterland
```

Restart `npm run dev` after changing environment variables. In live mode, the
browser calls `/dev-api/orthanc/`; Vite forwards those calls to Orthanc and adds
the token on its server side. `ORTHANC_API_TOKEN` must never be renamed with a
`VITE_` prefix because Vite exposes such values to browser code.

This proxy is for local development only. A deployed frontend will need an
equivalent same-origin backend or reverse proxy so service credentials stay out
of the browser bundle.

The separate read-only smoke test uses the same non-browser variables:

```sh
npm run smoke:orthanc
```

See [the Orthanc consumer contract](docs/integrations/orthanc.md) for verified
endpoints, response observations and remaining integration questions.

## Architecture

```text
React workbench -> application data source -> mock fixtures
                                      `----> Orthanc client -> Vite dev proxy
```

- `src/api/` owns transport details, Orthanc field names and normalization.
- `src/data/` exposes the application-facing read contract and selects mock or
  live implementations.
- `src/fixtures/` contains deterministic fictional data.
- `src/features/api-workbench/` is intentionally small diagnostic UI.

React components do not construct Orthanc requests or interpret its raw field
names. This boundary also leaves room for a future, separate Frontier Plot API
client without pretending that unfinished service is already part of the
application.

## Current scope

Implemented reads are Orthanc health, current event, current-event NPC users and
active figurant characters. Character results are normalized and duplicate join
rows are removed only when they differ solely in the observed `figu_name`
field; conflicting duplicate data fails visibly.

Character creation/editing, NPC assignment, RFID activation, Joomla session
integration, Watchtower, full UI parity and offline/PWA behavior are deferred to
later milestones.
