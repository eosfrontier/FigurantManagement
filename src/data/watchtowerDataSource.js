import { ContractError } from '../api/errors.js'

function integerInRange(value, field, minimum, maximum) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new ContractError(`Watchtower returned an invalid ${field}.`, {
      code: 'INVALID_WATCHTOWER_DATE',
      details: { field, value },
    })
  }
  return number
}

export function normalizeInGameDate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ContractError('Watchtower time must be an object.', {
      code: 'INVALID_WATCHTOWER_DATE',
    })
  }

  const year = integerInRange(raw.iYear, 'year', 0, 9999)
  const month = integerInRange(raw.iMonth, 'month', 1, 12)
  const maximumDay = new Date(2000, month, 0).getDate()
  const day = integerInRange(raw.iDay, 'day', 1, maximumDay)

  return {
    year,
    month,
    day,
    yearPrefix: String(raw.iYearBefore ?? ''),
    yearSuffix: String(raw.iYearAfter ?? ''),
  }
}

export function createWatchtowerDataSource(client) {
  return {
    async getCurrentInGameDate({ signal } = {}) {
      return normalizeInGameDate(await client.getCurrentTime({ signal }))
    },
  }
}
