import config from '../../config.js'

export const FIGURANT_FACTIONS = [...config.Factions]
export const CUSTOMS_DISPOSITIONS = [
  'ICC VETTED',
  'ACCESS GRANTED',
  'ACCESS PENDING',
  'DETAIN',
  'DECEASED',
  'AWOL',
  'MIA',
]
export const BLOOD_TYPES = ['O', 'A', 'B', 'AB']
const ICC_FACTION_PREFIXES = {
  aquila: 7,
  dugo: 3,
  ekanesh: 8,
  pendzal: 9,
  sona: 5,
  kadu: 0,
  hasiru: 0,
}

function requiredText(value, field, maximumLength = 255) {
  const text = String(value ?? '').trim()
  if (!text) throw new TypeError(`${field} is required.`)
  if (text.length > maximumLength) {
    throw new TypeError(`${field} must be at most ${maximumLength} characters.`)
  }
  return text
}

function optionalText(value, field, maximumLength = 255) {
  const text = String(value ?? '').trim()
  if (text.length > maximumLength) {
    throw new TypeError(`${field} must be at most ${maximumLength} characters.`)
  }
  return text || null
}

function integerInRange(value, field, minimum, maximum) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new TypeError(`${field} must be between ${minimum} and ${maximum}.`)
  }
  return number
}

export function normalizePreparedFigurantDraft(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('A prepared figurant draft is required.')
  }

  const factionId = requiredText(value.factionId, 'Faction', 32).toLowerCase()
  if (!FIGURANT_FACTIONS.includes(factionId)) {
    throw new TypeError('Faction must be one of the supported factions.')
  }

  const customsDisposition = requiredText(
    value.customsDisposition,
    'Customs disposition',
    64,
  ).toUpperCase()
  if (!CUSTOMS_DISPOSITIONS.includes(customsDisposition)) {
    throw new TypeError('Customs disposition is not supported.')
  }

  const bloodType = requiredText(value.bloodType, 'Blood type', 2).toUpperCase()
  if (!BLOOD_TYPES.includes(bloodType)) {
    throw new TypeError('Blood type is not supported.')
  }

  const iccNumber = requiredText(value.iccNumber, 'ICC number', 15)
  if (!/^\d{4} \d{5} \d{4}$/.test(iccNumber)) {
    throw new TypeError('ICC number must use the format 1234 12345 1234.')
  }

  return {
    characterName: requiredText(value.characterName, 'Character name'),
    factionId,
    rank: optionalText(value.rank, 'Rank or job'),
    threatAssessment: integerInRange(
      value.threatAssessment,
      'Threat assessment',
      0,
      5,
    ),
    customsDisposition,
    customsNotes: optionalText(value.customsNotes, 'Customs notes', 2000),
    bastionClearance: integerInRange(
      value.bastionClearance,
      'Bastion clearance',
      0,
      3,
    ),
    iccNumber,
    bloodType,
    birthDate: requiredText(value.birthDate, 'Birth date', 64),
    homePlanet: requiredText(value.homePlanet, 'Home planet'),
    plotReference: optionalText(value.plotReference, 'Plot reference', 32),
    recurring: Boolean(value.recurring),
  }
}

function luhnCheckDigit(value) {
  const digits = `${value}0`
  let sum = 0
  let shouldDouble = false

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])
    if (shouldDouble && (digit *= 2) > 9) digit -= 9
    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0 ? '0' : String(10 - (sum % 10))
}

export function generateIccNumber(factionId, { now = new Date(), random = Math.random } = {}) {
  const normalizedFaction = String(factionId).toLowerCase()
  if (!FIGURANT_FACTIONS.includes(normalizedFaction)) {
    throw new TypeError('A supported faction is required.')
  }

  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now - startOfYear) / 86_400_000)
  const prefix = `${ICC_FACTION_PREFIXES[normalizedFaction]}${String(dayOfYear).padStart(3, '0')}`
  const randomPart = String(Math.floor(random() * 90_000_000) + 10_000_000)
  const firstTwelve = `${prefix}${randomPart}`
  const complete = `${firstTwelve}${luhnCheckDigit(firstTwelve)}`
  return `${complete.slice(0, 4)} ${complete.slice(4, 9)} ${complete.slice(9)}`
}

export function preparedDraftToFigurant(draft, characterId) {
  const value = normalizePreparedFigurantDraft(draft)
  return {
    characterId: String(characterId),
    ...value,
    status: value.recurring ? 'figurant-recurring' : 'figurant',
    cardId: null,
    assignedExternalUserId: null,
    assignedDisplayName: null,
  }
}

export function figurantToEditableDetails(figurant) {
  return normalizePreparedFigurantDraft(figurant)
}
