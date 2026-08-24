import { ContractError } from './errors.js'

function expectArray(value, operation) {
  if (!Array.isArray(value)) {
    throw new ContractError(`${operation} must return an array.`, {
      code: 'EXPECTED_ARRAY',
      details: { operation, received: value === null ? 'null' : typeof value },
    })
  }
  return value
}

function requiredString(value, field) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new ContractError(`Missing required field: ${field}.`, {
      code: 'MISSING_FIELD',
      details: { field },
    })
  }
  return String(value)
}

function nullableString(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null
  }
  return String(value)
}

function integerInRange(value, field, minimum, maximum) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new ContractError(`Invalid ${field}.`, {
      code: 'INVALID_NUMBER',
      details: { field, minimum, maximum },
    })
  }
  return number
}

function jsonEquivalent(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function differingDuplicateFields(records) {
  const ignoredFields = new Set(['figu_name'])
  const fields = new Set(records.flatMap((record) => Object.keys(record)))

  return [...fields]
    .filter((field) => !ignoredFields.has(field))
    .filter((field) =>
      records.some((record) => !jsonEquivalent(record[field], records[0][field])),
    )
    .sort()
}

export function normalizeHealth(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.healthy !== 'boolean') {
    throw new ContractError('Health response must contain boolean healthy.', {
      code: 'INVALID_HEALTH',
    })
  }
  return { healthy: raw.healthy }
}

export function normalizeGroups(raw) {
  return expectArray(raw, 'getGroupsByName').map((group) => ({
    id: requiredString(group.id, 'group.id'),
    parentId: nullableString(group.parent_id),
    title: requiredString(group.title, 'group.title'),
  }))
}

export function normalizeUsers(raw) {
  return expectArray(raw, 'getUsersByGroup').map((user) => ({
    externalUserId: requiredString(user.id, 'user.id'),
    displayName: requiredString(user.name, 'user.name'),
  }))
}

export function normalizeSession(raw, managerGroupIds = []) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ContractError('Joomla session response must be an object.', {
      code: 'INVALID_SESSION',
    })
  }

  const externalUserId = requiredString(raw.id, 'session.id')
  const rawGroups =
    externalUserId === '0' && raw.groups === null
      ? []
      : expectArray(raw.groups, 'getSession.groups')
  const groupIds = [
    ...new Set(
      rawGroups.map((groupId) => requiredString(groupId, 'session.groups[]')),
    ),
  ]
  const managerGroups = new Set(managerGroupIds.map(String))
  const authenticated = externalUserId !== '0'
  const canManageFigurants =
    authenticated && groupIds.some((groupId) => managerGroups.has(groupId))

  return {
    externalUserId,
    groupIds,
    authenticated,
    canManageFigurants,
    role: !authenticated ? 'guest' : canManageFigurants ? 'manager' : 'player',
  }
}

export function normalizeAffectedRows(raw, operation) {
  if (
    (typeof raw !== 'number' && typeof raw !== 'string') ||
    String(raw).trim() === ''
  ) {
    throw new ContractError(`${operation} must return an affected-row count.`, {
      code: 'INVALID_MUTATION_RESULT',
      details: { operation },
    })
  }

  const affectedRows = Number(raw)
  if (!Number.isInteger(affectedRows) || affectedRows < 0) {
    throw new ContractError(`${operation} returned an invalid affected-row count.`, {
      code: 'INVALID_MUTATION_RESULT',
      details: { operation },
    })
  }
  return affectedRows
}

export function normalizeCurrentEvent(raw) {
  const events = expectArray(raw, 'getCurrentEvent')
  if (events.length === 0) return null

  const event = events[0]
  return {
    externalEventId: requiredString(event.id, 'event.id'),
    title: requiredString(event.title, 'event.title'),
    startDate: requiredString(event.start_date, 'event.start_date'),
    endDate: requiredString(event.end_date, 'event.end_date'),
    parentId: nullableString(event.parent_id),
    categoryId: nullableString(event.category_id),
    locationId: nullableString(event.location_id),
    eventType: nullableString(event.event_type),
  }
}

function normalizeFigurant(record, userNames) {
  const assignedExternalUserId = nullableString(record.figu_accountID)
  const status = requiredString(record.status, 'figurant.status')

  if (!['figurant', 'figurant-recurring'].includes(status)) {
    throw new ContractError('Unexpected figurant status.', {
      code: 'INVALID_FIGURANT_STATUS',
      details: { status },
    })
  }

  return {
    characterId: requiredString(record.characterID, 'figurant.characterID'),
    characterName: requiredString(
      record.character_name,
      'figurant.character_name',
    ),
    factionId: requiredString(record.faction, 'figurant.faction').toLowerCase(),
    status,
    recurring: status === 'figurant-recurring',
    cardId: nullableString(record.card_id),
    rank: nullableString(record.rank),
    threatAssessment: integerInRange(
      record.threat_assessment,
      'threat_assessment',
      0,
      5,
    ),
    customsDisposition: requiredString(
      record.douane_disposition,
      'figurant.douane_disposition',
    ),
    customsNotes: nullableString(record.douane_notes),
    bastionClearance: integerInRange(
      record.bastion_clearance,
      'bastion_clearance',
      0,
      3,
    ),
    iccNumber: nullableString(record.ICC_number ?? record.icc_number),
    bloodType: nullableString(record.bloodtype),
    birthDate: nullableString(record.ic_birthday),
    homePlanet: nullableString(record.homeplanet),
    assignedExternalUserId,
    assignedDisplayName: assignedExternalUserId
      ? userNames.get(assignedExternalUserId) ?? null
      : null,
    plotReference: nullableString(record.plotname),
  }
}

export function normalizeFigurants(raw, users = []) {
  const records = expectArray(raw, 'getActiveFigurants')
  const recordsById = new Map()

  for (const record of records) {
    const id = requiredString(record?.characterID, 'figurant.characterID')
    if (!recordsById.has(id)) recordsById.set(id, [])
    recordsById.get(id).push(record)
  }

  let duplicateRows = 0
  let duplicateGroups = 0
  for (const [characterId, variants] of recordsById) {
    if (variants.length === 1) continue
    duplicateRows += variants.length - 1
    duplicateGroups += 1
    const differingFields = differingDuplicateFields(variants)
    if (differingFields.length > 0) {
      throw new ContractError(
        'Duplicate figurant rows contain conflicting character data.',
        {
          code: 'CONFLICTING_DUPLICATES',
          details: { characterId, differingFields },
        },
      )
    }
  }

  const userNames = new Map(
    users.map((user) => [String(user.externalUserId), user.displayName]),
  )
  const items = [...recordsById.values()]
    .map(([record]) => normalizeFigurant(record, userNames))
    .sort((left, right) =>
      left.characterName.localeCompare(right.characterName, undefined, {
        sensitivity: 'base',
      }),
    )

  return {
    items,
    sourceCount: records.length,
    duplicateRows,
    duplicateGroups,
    warnings:
      duplicateRows > 0
        ? [
            {
              code: 'DUPLICATE_JOIN_ROWS',
              message: `${duplicateRows} duplicate join rows were removed.`,
            },
          ]
        : [],
  }
}
