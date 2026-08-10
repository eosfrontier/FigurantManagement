# Orthanc consumer contract

## Purpose

This document describes the part of the Orthanc v2 API consumed by Figurant Management. It is a consumer contract, not complete Orthanc API documentation and not a replacement for the upstream documentation.

The contract isolates Orthanc-specific transport and data conventions from React components. Future client code should implement these details in a dedicated adapter and expose normalized application models to the UI.

## Contract status

The following evidence labels are used throughout this document:

- **Documented**: stated in the upstream Orthanc documentation.
- **Source-derived**: confirmed by inspecting the upstream implementation on 2026-08-10.
- **Client-observed**: relied upon by the existing Svelte client or its fixtures.
- **Live-verified**: exercised against an approved Orthanc environment. Nothing is live-verified yet.

Do not silently promote a source-derived assumption to live-verified. When live smoke tests are run, record the date, environment type, and sanitized result in the verification log.

## Sources

- [Orthanc v2 overview](https://github.com/eosfrontier/orthanc/blob/master/v2/README.md)
- [Figurant endpoint documentation](https://github.com/eosfrontier/orthanc/blob/master/v2/chars_figu/README.md)
- [All-characters endpoint documentation](https://github.com/eosfrontier/orthanc/blob/master/v2/chars_all/README.md)
- [Joomla endpoint documentation](https://github.com/eosfrontier/orthanc/blob/master/v2/joomla/README.md)
- [Joomla users documentation](https://github.com/eosfrontier/orthanc/blob/master/v2/joomla/users/README.md)
- [Joomla groups documentation](https://github.com/eosfrontier/orthanc/blob/master/v2/joomla/groups/README.md)
- [Current-event documentation](https://github.com/eosfrontier/orthanc/blob/master/v2/event/current/README.md)
- [Current-event figuranten documentation](https://github.com/eosfrontier/orthanc/blob/master/v2/event/current/figuranten/README.md)
- Upstream endpoint and class implementations linked from the relevant sections below.
- A local Postman Collection v2.1 supplied on 2026-08-10. It is intentionally not committed because it contains a credential value.
- The current Svelte client in this repository.

## Configuration and credential handling

Local server-side development tooling reads:

```dotenv
ORTHANC_BASE_URL=
ORTHANC_API_TOKEN=
```

Copy `.env.example` to `.env.local`. The local file is ignored by Git.

`ORTHANC_API_TOKEN` must never:

- Be committed.
- Be printed in logs or test output.
- Be included in fixtures or snapshots.
- Use a `VITE_` prefix.
- Be read directly by browser application code.

Vite exposes `VITE_*` variables to the browser bundle. The eventual browser client should call a same-origin development proxy or backend-for-frontend that adds the Orthanc token server-side.

If a token has previously been committed, posted publicly, or distributed in an old Postman collection, treat it as exposed and rotate it.

## Base URL and version

The documented API root is:

```text
{orthanc-origin}/orthanc/v2/
```

`ORTHANC_BASE_URL` may be either the Orthanc host origin or the complete v2 root. The smoke-test tooling appends `/orthanc/v2/` only when the configured URL has no path. Examples:

```text
https://example.invalid/
https://example.invalid/orthanc/v2/
```

The tracked legacy `environment.js` currently uses a host root and appends paths such as `chars_figu/`. Before live migration, verify whether deployed configuration includes `/orthanc/v2/` elsewhere or whether the local value is outdated.

## Transport conventions

### Authentication

Every covered endpoint requires a custom request header:

```http
token: <credential>
```

The upstream token middleware returns HTTP `401` with a JSON string when the header is absent or invalid. This is source-derived from [the token middleware](https://github.com/eosfrontier/orthanc/blob/master/includes/token.php).

### Parameters

Orthanc v2 uses custom request headers for resource selectors and payloads. Although some requests may contain disabled Postman query examples, this client contract uses headers because that matches the upstream documentation, implementation input handling, Postman collection, and current client.

Presence-only flags such as `all_figurants` and `current_event` should be sent with a small explicit value such as `1`. Never pass JavaScript `undefined` as a header value.

### Payloads

Figurant mutations send the object as JSON serialized into the `figurant` request header:

```http
figurant: {"character_name":"..."}
```

This is legacy behavior. Keep it inside the Orthanc adapter rather than treating it as a general application convention.

### Responses

- Responses are JSON.
- Several endpoints use a JSON string for error detail instead of an error object.
- Collection endpoints may return HTTP `404` with JSON string `"None found."` rather than HTTP `200` with an empty array.
- Identifier and numeric fields originate in database rows and may be JSON strings. The adapter must normalize deliberately rather than relying on coercion in React components.

## Endpoint summary

| Purpose | Method and path | Current use | First-slice use |
| --- | --- | --- | --- |
| Health check | `GET health/` | No | Yes |
| Joomla session | `GET joomla/` | Indirectly, through `assets/idandgroups.php` | To evaluate |
| Find Joomla group | `GET joomla/groups/` | Yes | Possibly |
| List assignable users | `GET joomla/users/` | Yes | Yes |
| List active figurant characters | `GET chars_figu/` | Yes | Yes |
| Get one figurant character | `GET chars_figu/` | Yes | Later UI parity |
| Check ICC number across characters | `GET chars_all/` | Yes | Later UI parity |
| Create figurant | `POST chars_figu/` | Yes | No, read-only milestone |
| Update/assign/card-link figurant | `PUT chars_figu/` | Yes | No, read-only milestone |
| Soft-delete/restore figurant | `DELETE chars_figu/` | Delete currently used | No, read-only milestone |
| Get current event | `GET event/current/` | No | Optional diagnostic |
| Get current-event figuranten | `GET event/current/figuranten/` | No | Do not adopt yet |

Watchtower is a separate service and is outside this contract.

## Read endpoints

### Health

```http
GET health/
token: <credential>
```

Expected response shape, source-derived from [the Health class](https://github.com/eosfrontier/orthanc/blob/master/includes/classes/Health.php):

```json
{ "healthy": true }
```

or:

```json
{
  "healthy": false,
  "message": "Unable to connect"
}
```

The implementation returns JSON directly from the health method. Do not assume an unhealthy database produces a non-2xx status; check the `healthy` field.

### Joomla session

```http
GET joomla/
token: <credential>
```

Source-derived response shape:

```json
{
  "id": "719",
  "groups": ["31"]
}
```

The exact JSON types of `id` and group entries require live verification. The upstream implementation returns the Joomla ID and group collection; see [Joomla.php](https://github.com/eosfrontier/orthanc/blob/master/includes/classes/Joomla.php).

The current frontend instead fetches the same-origin `assets/idandgroups.php`. Decide separately whether that helper remains necessary for Joomla cookie/session behavior. Possession of a service token is not evidence of the browser user's identity and must not replace authenticated user-session handling.

### Joomla groups

All groups:

```http
GET joomla/groups/
token: <credential>
```

Name search:

```http
GET joomla/groups/
token: <credential>
name: monsterland
```

**Documented and source-derived:** `name` performs a substring-style lookup.

Source-derived item shape:

```json
{
  "id": "29",
  "parent_id": "...",
  "title": "monsterland"
}
```

The success response is an array. No matches produce HTTP `404` with a JSON string.

Do not scatter numeric group IDs through UI code. Resolve them through configuration or an upstream authorization mapping.

### Joomla users by group

All users in a group and its direct child groups:

```http
GET joomla/users/
token: <credential>
group_id: 29
```

Only registered users for the current event:

```http
GET joomla/users/
token: <credential>
group_id: 29
current_event: 1
```

`group_id` is required. `current_event` is a presence-only optional flag. Both are documented upstream.

Source-derived item shape:

```json
{
  "id": "719",
  "name": "Example Name"
}
```

The success response is an array ordered by name. No matches produce HTTP `404` with a JSON string. A missing `group_id` produces HTTP `400` with a JSON string.

This is the preferred source for the first-slice assignable-user list because it returns only ID and display name.

### Active figurant characters

```http
GET chars_figu/
token: <credential>
all_figurants: 1
```

**Documented and source-derived:** returns active figurant and figurant-recurring rows whose sheet status is not deleted.

The source query selects the character row plus a calculated `figu_name`. The success response is an array. No records produce HTTP `404` with a JSON string.

Client-observed raw fields include:

```json
{
  "characterID": "410",
  "character_name": "Yusuf Miro",
  "card_id": null,
  "faction": "sona",
  "status": "figurant",
  "rank": "Envoy",
  "threat_assessment": "1",
  "douane_disposition": "ACCESS GRANTED",
  "douane_notes": "",
  "bastion_clearance": "0",
  "ICC_number": "5218 58868 7536",
  "bloodtype": "O",
  "ic_birthday": "15-7-220NT",
  "homeplanet": "Ghara",
  "figu_accountID": null,
  "plotname": "Event 24 - Plot 12",
  "figu_name": null
}
```

This example combines current client fixtures and source-derived query behavior. The complete row and exact field casing must be captured from a sanitized live response before fixture shapes are finalized.

Upstream implementation: [`chars_figu/_get.php`](https://github.com/eosfrontier/orthanc/blob/master/v2/chars_figu/_get.php) and [`Char_Figu.php`](https://github.com/eosfrontier/orthanc/blob/master/includes/classes/Char_Figu.php).

### One active figurant character

```http
GET chars_figu/
token: <credential>
id: 410
```

The upstream code also accepts `char_id`, but this client should consistently use `id` to match its existing behavior.

Success is a single JSON object. Missing or deleted records produce HTTP `404` with a JSON string. A request without any recognized selector produces HTTP `400`.

The endpoint also supports documented lookup headers `accountID`, `card_id`, and `icc_number`. Add adapter functions only when a client workflow needs them.

### ICC-number uniqueness check

```http
GET chars_all/
token: <credential>
icc_number: 5218 58868 7536
all_statuses: 1
```

The existing client supplies `all_statuses` so deleted/inactive records also participate in collision detection. The upstream source supports this flag, although it is not listed in the endpoint's parameter table.

Existing-client interpretation:

- HTTP `404`: no matching character; candidate is available.
- HTTP `200`: one or more matches; collision.
- Any other result: uniqueness could not be established and generation must fail rather than assuming availability.

Live verification must confirm whether the success response is consistently an array and whether deleted historical ICC numbers are intentionally non-reusable.

### Current event

```http
GET event/current/
token: <credential>
```

Source-derived response shape is an array containing an event row:

```json
[
  {
    "id": "...",
    "parent_id": "...",
    "category_id": "1",
    "location_id": "...",
    "title": "...",
    "event_type": "...",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD"
  }
]
```

This endpoint is not required by the current frontend but may be useful for the diagnostic workbench.

### Current-event figuranten

```http
GET event/current/figuranten/
token: <credential>
```

Do not adopt this endpoint for the first slice yet.

The upstream documentation says it returns OC information for registered figuranten. The current source includes `phone` and `email`, which are unnecessary for role assignment, and the reviewed implementation contains a hardcoded event ID in its query despite computing the current event ID. Prefer `joomla/users/` with `current_event` until this endpoint is corrected, minimized, and live-verified.

Upstream implementation: [`Event.php`](https://github.com/eosfrontier/orthanc/blob/master/includes/classes/Event.php).

## Mutation endpoints

Mutations are documented for parity planning but are excluded from the first read-only milestone.

### Create figurant

```http
POST chars_figu/
token: <credential>
figurant: <JSON-serialized object>
```

Source-derived payload fields:

| Raw field | Required by implementation | Notes |
| --- | --- | --- |
| `character_name` | Yes | Upstream parameter table incorrectly says `figurant_name`; implementation and current client use `character_name`. |
| `card_id` | Effectively yes | Operational workflow requires prepared roles without a real card; representation must be live-verified. |
| `faction` | Yes | Lowercase. Current client has more factions than the upstream documentation lists. |
| `rank` | No | Implementation defaults it to null. |
| `threat_assessment` | Yes | Upstream table contains the typo `threat_assesment`; implementation uses `threat_assessment`. |
| `douane_disposition` | Yes | Allowed values need live/current-domain confirmation. |
| `douane_notes` | Yes | Created empty; intended for customs/player use later. |
| `bastion_clearance` | Yes | Documented range differs from current UI range and needs confirmation. |
| `icc_number` | Yes | Must be unique. |
| `bloodtype` | Yes | Current values: `O`, `A`, `B`, `AB`. |
| `ic_birthday` | Yes | Free-form string in Orthanc. |
| `homeplanet` | Yes | Not checked against a planet table. |
| `plotname` | No | Free-text legacy plot reference. |
| `recurring` | No | Only boolean true creates status `figurant-recurring`. |
| `figu_accountID` | No | Nullable Joomla account assignment. |

Success returns HTTP `200` with a JSON-encoded inserted character ID, typically a string. The implementation may also return a database error string with HTTP `200`; client code must not assume every 200 response is a valid ID until live behavior is characterized.

#### Prepared role without a card

The operational manual and confirmed workflow require an SL to create a prepared role before assigning a physical card or NPC.

The current client converts a missing card to the literal string `noID`. The upstream card-assignment implementation treats any repeated card value as an assignment and removes that value from the previous figurant. Therefore using one shared `noID` sentinel may cause unintended reassignment semantics.

Before restoring create behavior, live-test and agree on the canonical representation of no card: preferably database `NULL`, otherwise an explicitly supported unique strategy. Do not encode `noID` into the new adapter without verification.

### Update figurant

```http
PUT chars_figu/
token: <credential>
id: 410
figurant: <JSON-serialized partial object>
```

The implementation accepts a partial object and dynamically updates each included field. Success returns HTTP `200` with a JSON number representing affected rows.

Important source-derived behavior:

- Assigning a card already used by another figurant clears it from that figurant and assigns it to the target.
- A card belonging to a player character is rejected with HTTP `400`.
- `recurring: true` sets `figurant-recurring`; other values set `figurant`.
- `figu_accountID: "null"` clears the assignment. This string sentinel should be contained within the adapter.
- A valid no-op may return `0` affected rows.

The card move and assignment behavior must be tested against a development dataset before relying on it during an event.

### Soft-delete and restore figurant

Soft-delete:

```http
DELETE chars_figu/
token: <credential>
id: 410
```

Restore:

```http
DELETE chars_figu/
token: <credential>
id: 410
restore: 1
```

Delete sets `sheet_status` to `deleted`, clears `card_id`, and records deletion metadata. It does not hard-delete the database row. Restore changes the sheet status back to active and removes the deletion metadata.

Success returns HTTP `200` with a JSON string. Missing/already-transitioned records return HTTP `404` with a JSON string. A missing `id` returns HTTP `400`.

Despite use of HTTP `DELETE` for restore, preserve the upstream convention inside the Orthanc adapter until the upstream API changes.

## Raw-to-normalized field mapping

Initial mapping for the frontend adapter:

| Orthanc field | Application field | Normalization |
| --- | --- | --- |
| `characterID` | `characterId` | Required string |
| `character_name` | `characterName` | Required string |
| `card_id` | `cardId` | Nullable string; sentinel behavior unresolved |
| `faction` | `factionId` | Lowercase string |
| `status` | `recurring` | `true` only for `figurant-recurring` |
| `rank` | `rank` | Nullable string |
| `threat_assessment` | `threatAssessment` | Integer after validation |
| `douane_disposition` | `customsDisposition` | String/known-value validation |
| `douane_notes` | `customsNotes` | String |
| `bastion_clearance` | `bastionClearance` | Integer after validation |
| `ICC_number` or `icc_number` | `iccNumber` | Formatted string; accept casing at boundary only |
| `bloodtype` | `bloodType` | Nullable known value |
| `ic_birthday` | `birthDate` | String; do not parse until requirements demand it |
| `homeplanet` | `homePlanet` | String |
| `figu_accountID` | `assignedExternalUserId` | Nullable string |
| `figu_name` | `assignedDisplayName` | Nullable string; display projection only |
| `plotname` | `plotReference` | Nullable legacy free text |

Unknown fields should not be spread directly into UI state. During contract discovery, retain them only in an optional diagnostic raw view.

## Error normalization

The Orthanc adapter should convert transport responses to an application error similar to:

```js
{
  name: "ApiError",
  service: "orthanc",
  operation: "listFigurantCharacters",
  status: 404,
  code: "NOT_FOUND",
  message: "No figurant characters were found.",
  retryable: false
}
```

Rules:

- Never display a token, raw request headers, or internal database errors.
- Treat endpoint-specific `404` collection responses as an empty result only when the operation contract explicitly defines that interpretation.
- Treat `401` as authentication/configuration failure, not an empty result.
- Treat unexpected response shapes as contract failures and retain a safe diagnostic message.
- Network errors and `5xx` responses may be retryable; validation and authentication failures are normally not.

## Live verification plan

Use an approved development hostname and token through server-side tooling. The first smoke run must be read-only.

Recommended order:

1. `GET health/`
2. `GET joomla/groups/` with `name: monsterland`
3. `GET joomla/users/` with the resolved group ID and `current_event: 1`
4. `GET chars_figu/` with `all_figurants: 1`
5. `GET event/current/`
6. ICC lookup only with a sanitized or deliberately nonexistent test value.

For each response:

- Record status, content type, top-level JSON type, and field names.
- Do not record tokens, phone numbers, email addresses, or unnecessary personal data.
- Store only sanitized fixtures in the repository.
- Verify empty-result behavior separately where it can be done safely.
- Do not perform POST, PUT, or DELETE until a development dataset and mutation scope are explicitly approved.

## Known discrepancies and decisions pending

1. **Base path:** Postman/upstream use `/orthanc/v2/`; legacy local configuration does not show it.
2. **No-card representation:** manual requires no card during preparation; current client sends `noID`; preferred Orthanc representation is not confirmed.
3. **Figurant name field:** upstream table says `figurant_name`; implementation uses `character_name`.
4. **Threat field spelling:** upstream table says `threat_assesment`; implementation/client use `threat_assessment`.
5. **ICC casing:** current responses/fixtures use `ICC_number`; request selectors and payloads use `icc_number`.
6. **Faction list:** upstream documentation omits factions present in the current frontend configuration.
7. **Disposition list:** current frontend includes values not listed in the older endpoint documentation.
8. **Bastion clearance range:** upstream documentation and current UI appear to disagree.
9. **Duplicates:** current UI deduplicates `all_figurants` by character ID; upstream query uses `DISTINCT`, so the source of duplicates is unknown.
10. **Current-event figuranten:** source includes unnecessary contact details and appears to hardcode an event ID.
11. **Authentication versus identity:** the API token authenticates the calling service, while Joomla session data identifies the browser user. These concerns must not be conflated.

## Verification log

| Date | Environment | Operations | Result |
| --- | --- | --- | --- |
| 2026-08-10 | Documentation/source review | All endpoints in this document | Request contract drafted; no live calls made |
| 2026-08-10 | Codex development shell | `GET health/` | Cloudflare returned a managed-challenge HTTP 403 before Orthanc. Credential-free probes received the same response, so the token was neither validated nor rejected and no response schema was live-verified. |
