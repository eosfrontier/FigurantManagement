# Figurant Management

This branch contains the plain-JavaScript React rebuild of the Frontier Figurant
Manager. It currently provides faction-name generation, the authorized character
list, and the first deliberately gated write workflow: NPC assignment.

The markup is deliberately unstyled so frontend work can concentrate on visual
design without also having to reconstruct the application behavior.

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
Local development also uses a fictional Joomla manager session by default.
Mock assignment changes are in-memory and reset when the development server is
restarted.

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
VITE_AUTH_MODE=mock
VITE_ENABLE_MUTATIONS=false
```

Restart `npm run dev` after changing environment variables. In live mode, the
browser calls `/dev-api/orthanc/`; Vite forwards those calls to Orthanc and adds
the token on its server side. `ORTHANC_API_TOKEN` must never be renamed with a
`VITE_` prefix because Vite exposes such values to browser code.

The development and smoke-test commands prefer IPv4 when resolving the Orthanc
host. The current IPv4 address is allowlisted, while this development machine's
temporary IPv6 privacy address rotates and is rejected by Cloudflare. Node may
still fall back to IPv6 if no IPv4 connection is available.

This proxy is for local development only. A deployed frontend will need an
equivalent same-origin backend or reverse proxy so service credentials stay out
of the browser bundle.

## Assignment mutations

The character table supports explicitly saving an NPC assignment or selecting
`Unassigned`. It prevents concurrent submissions, reports pending/success/failure
states, permits retrying a failure, and refreshes the list after Orthanc accepts
the update.

Mock mode enables this workflow by default. Live mode disables all assignment
controls unless `VITE_ENABLE_MUTATIONS=true` is explicitly configured. This flag
is an accident-prevention gate, not authorization. A deployed same-origin proxy
must validate the Joomla session and manager group before forwarding any write
with the Orthanc service token.

Because there is no dedicated Orthanc development dataset, live verification
must use a deliberately selected fictional character, record its original
assignment, and restore that exact value even when the test fails. No live
mutation is performed by the normal test suite or `smoke:orthanc`.

The separate read-only smoke test uses the same non-browser variables:

```sh
npm run smoke:orthanc
```

See [the Orthanc consumer contract](docs/integrations/orthanc.md) for verified
endpoints, response observations and remaining integration questions.
Watchtower's separately verified read contract is documented in
[the Watchtower consumer contract](docs/integrations/watchtower.md).

## Joomla session visibility

The hosted application reads the existing Joomla session through the same
same-origin helper pattern used by AegisBreaker:

```dotenv
VITE_AUTH_MODE=joomla
VITE_JOOMLA_MANAGER_GROUPS=30,36,8,31
VITE_JOOMLA_LOGIN_URL=https://www.eosfrontier.space/return-to-persona
```

The browser requests `/assets/idandgroups.php` with cookies included and caching
disabled. That PHP file must be served by the Joomla/PHP host; Vite's development
server only serves it as a static file and cannot execute it. Use `mock` locally,
optionally overriding the fictional session with `VITE_JOOMLA_MOCK_USER` as shown
in `.env.example`.

The production application is hosted at `https://persona.eosfrontier.space/` and
uses `https://www.eosfrontier.space/return-to-persona` for its Joomla login flow.
Manager group `31` is intentionally included so the NPC developer can exercise
the SL interface; it is not an inference that all NPCs should receive backend
write authorization.

Session groups only control frontend visibility. They do not authorize future
Orthanc mutations, which must remain protected upstream.

## Architecture

```text
React UI -> application data source -> mock fixtures
                             |-----> Joomla session helper
                             `-----> Orthanc client -> Vite dev proxy
```

- `src/api/` owns transport details, Orthanc field names and normalization.
- `src/data/` exposes the application-facing read contract and selects mock or
  live implementations.
- `src/fixtures/` contains deterministic fictional data.
- `src/features/name-generator/` owns faction-name behavior.
- `src/features/figurant-list/` owns the sortable/filterable list and gated
  assignment workflow.
- `src/features/api-workbench/` remains available as collapsed diagnostics.

React components do not construct Orthanc requests or interpret its raw field
names. 

## Current scope

Implemented reads are the Joomla session plus Orthanc health, current event,
current-event NPC users and active figurant characters. Character results are
normalized and duplicate join rows are removed only when they differ solely in
the observed `figu_name` field; conflicting duplicate data fails visibly.

The public name generator uses the existing seven faction datasets. Authorized
Joomla groups additionally see an automatically loaded character table with
column sorting, filtering, refresh, loading, empty and retry states. Assignment
and unassignment are implemented and enabled by default only for mock data.

Character creation/editing, RFID activation, Watchtower, offline/PWA behavior
and all other mutations are deferred to later milestones.
