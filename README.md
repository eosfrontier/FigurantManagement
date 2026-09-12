# Figurant Management

This branch contains the plain-JavaScript React rebuild of the Frontier Figurant
Manager. It currently provides faction-name generation, the authorized character
list, and deliberately gated, offline-tolerant NPC-assignment and RFID-card
replacement workflows.

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
Mock assignment and card changes are in-memory and reset when the page is reloaded.

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

## Assignment and RFID-card mutations

The character table supports explicitly assigning an NPC or selecting
`Unassigned`. A save updates the visible row immediately and writes the intended
state to a durable browser outbox. The operator can continue assigning other
characters while the outbox sends changes to Orthanc one at a time.

In live mode, the latest successful character and assignable-user response plus
the pending outbox are stored in IndexedDB. A failed or slow read falls back to
that snapshot, and queued assignments resume when connectivity returns or the
application is opened again. Repeated unsent changes for one character are
coalesced to the latest intended assignment.

Each write attempt has a 15-second client deadline. Retryable network and `5xx`
failures use an exponential retry delay capped at one minute. Absolute assignment
writes are safe to repeat; an Orthanc affected-row response of `0` is considered
success because the requested state already exists. Non-retryable rejections stay
visible for manual retry or discard. Successful writes are reported as a grouped
synchronization message instead of one notification per character.

The Card ID column also accepts scans from a keyboard-wedge RFID reader. Scanning
a card queues an absolute card-to-character replacement and updates the visible
rows immediately. If that card is already shown on another figurant, the local
projection clears the previous holder, matching Orthanc's replacement behavior.
Repeated unsent scans coalesce by both destination character and card ID so an
older retry cannot move a reused card back to an obsolete character. Card writes
use their own durable, serialized queue and grouped synchronization message.

There is deliberately no **Release card** action. The current Orthanc `PUT`
implementation has no safe, documented representation for writing SQL `NULL` to
`card_id`; empty and JSON-null values can become an empty string. A card can be
replaced or moved to another character, but explicit release remains deferred
until that upstream contract is fixed.

The browser must remain open for immediate retry processing. This implementation
does not depend on service-worker background-sync support; if the browser or
computer closes, processing resumes on the next application launch. Clearing the
site's browser data also clears its cached snapshot and unsent outbox. Discarding
an ambiguous timed-out item stops future retries but cannot undo a request that
Orthanc may already have received.

Mock mode enables these workflows by default. Live mode disables all mutation
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
        |                    |-----> Joomla session helper
        |                    `-----> Orthanc client -> Vite dev proxy
        `-> cached snapshot + durable assignment/card outboxes (live IndexedDB)
```

- `src/api/` owns transport details, Orthanc field names and normalization.
- `src/data/` exposes the application-facing read contract and selects mock or
  live implementations, plus the cached figurant-manager facade.
- `src/offline/` owns durable browser storage and serialized mutation retries.
- `src/fixtures/` contains deterministic fictional data.
- `src/features/name-generator/` owns faction-name behavior.
- `src/features/figurant-list/` owns the sortable/filterable list and gated
  assignment/card workflows.
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
column sorting, filtering, refresh, loading, empty and retry states. Assignment,
unassignment, and replacement-only RFID scans are implemented with optimistic
durable queuing and enabled by default only for mock data.

Character creation/editing, explicit RFID release, Watchtower,
service-worker/PWA installation behavior and all other mutations are deferred to
later milestones.
