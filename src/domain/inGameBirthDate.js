export const FALLBACK_IN_GAME_DATE = {
  year: 240,
  month: 1,
  day: 1,
  yearPrefix: '',
  yearSuffix: 'NT',
  fallback: true,
}

function validMonthDay(day, month) {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false
  if (month < 1 || month > 12) return false
  return day >= 1 && day <= new Date(2000, month, 0).getDate()
}

export function parseInGameBirthDate(value) {
  const match = String(value ?? '')
    .trim()
    .match(/^(\d{1,2})-(\d{1,2})-([^\d]*)(\d+)([^\d]*)$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[4])
  if (!validMonthDay(day, month) || !Number.isInteger(year)) return null

  return {
    day,
    month,
    year,
    yearPrefix: match[3],
    yearSuffix: match[5],
  }
}

export function ageOnDate(birthDate, currentDate) {
  if (!birthDate || !currentDate) return null
  let age = currentDate.year - birthDate.year
  const birthdayStillAhead =
    currentDate.month < birthDate.month ||
    (currentDate.month === birthDate.month && currentDate.day < birthDate.day)
  if (birthdayStillAhead) age -= 1
  return Number.isInteger(age) && age >= 0 ? age : null
}

export function birthDateForAge(ageValue, currentDate, existingBirthDate) {
  const age = Number(ageValue)
  if (!Number.isInteger(age) || age < 0 || age > 999) return null

  const existing = parseInGameBirthDate(existingBirthDate)
  const day = existing?.day ?? currentDate.day
  const month = existing?.month ?? currentDate.month
  const birthdayStillAhead =
    currentDate.month < month ||
    (currentDate.month === month && currentDate.day < day)
  const year = currentDate.year - age - (birthdayStillAhead ? 1 : 0)
  if (year < 0) return null

  return `${day}-${month}-${currentDate.yearPrefix}${year}${currentDate.yearSuffix}`
}
