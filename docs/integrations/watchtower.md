# Watchtower consumer contract

## Purpose

Figurant Management uses Watchtower only to obtain the current in-game date for
bidirectional age/birth-date calculation. Watchtower remains a separate
integration from Orthanc and the future Plot API. The read is non-critical and
may fall back to `1-1-240NT` when unavailable.

## Deployed endpoint

```http
GET https://api.eosfrontier.space/watchtower/time/
```

No API token or other authentication header is required. A read-only request on
2026-08-24 returned HTTP `200`, JSON content, and `Access-Control-Allow-Origin: *`.

The source application mounts its time router at `/api/time/`, but the public
reverse proxy exposes the consumer route above. The source-native public URL
`https://api.eosfrontier.space/watchtower/api/time/` returned HTTP `404` on the
same date and must not be used by this client.

The deployed path is corroborated by the current
[eos_douane consumer](https://github.com/eosfrontier/eos_douane/blob/master/includes/classes/class.douane.php)
and
[eos_shuttlebay consumer](https://github.com/eosfrontier/eos_shuttlebay/blob/main/includes/classes/class.shuttlebay.php).

## Live-verified response

```json
{
  "iYear": 240,
  "iYearBefore": "",
  "iYearAfter": "NT",
  "iDay": 27,
  "iMonth": 12,
  "iDayOfWeek": 7,
  "iDayName": "sunday",
  "iMonthName": "december"
}
```

Values are operational and must not be treated as constants. The client uses
`iYear`, `iMonth`, `iDay`, `iYearBefore`, and `iYearAfter`; the numeric fields are
range-validated before they are used. The remaining observed fields are ignored.

Changing age retains the entered birthday's day and month where possible and
recalculates its year against the current in-game date. Changing a valid birth
date recalculates age, including whether that year's birthday has occurred.

## Source-derived behavior

The current
[Watchtower routes](https://github.com/eosfrontier/eos-watchtower/blob/master/lib/routes.ts)
mount the time controller without authentication middleware. API keys in the
sample configuration belong to Watchtower's outbound integrations and are not
consumer credentials.

The controller may serve database-derived, cached, or hardcoded settings. A
successful response proves that a usable in-game date was returned, not that the
event settings database was reached.

Figurant Management must not call or expose Watchtower's settings endpoints.
Only the read-only time endpoint above is in scope.
