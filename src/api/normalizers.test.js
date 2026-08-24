import { describe, expect, it } from 'vitest'
import { ContractError } from './errors.js'
import {
  normalizeAffectedRows,
  normalizeFigurants,
  normalizeSession,
} from './normalizers.js'

function rawFigurant(overrides = {}) {
  return {
    characterID: '42',
    character_name: 'Rhea Vale',
    faction: 'EMPIRE',
    status: 'figurant',
    card_id: null,
    rank: 'Envoy',
    threat_assessment: '3',
    douane_disposition: 'Question',
    douane_notes: null,
    bastion_clearance: '2',
    ICC_number: null,
    bloodtype: null,
    ic_birthday: null,
    homeplanet: null,
    figu_accountID: '81',
    figu_name: 'A duplicate-producing join value',
    plotname: 'An envoy arrives',
    ...overrides,
  }
}

describe('normalizeFigurants', () => {
  it('deduplicates join rows, normalizes types and hydrates the NPC name', () => {
    const first = rawFigurant()
    const second = rawFigurant({ figu_name: 'Different join name' })

    const result = normalizeFigurants([first, second], [
      { externalUserId: '81', displayName: 'Alex Crew' },
    ])

    expect(result).toMatchObject({
      sourceCount: 2,
      duplicateRows: 1,
      duplicateGroups: 1,
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      characterId: '42',
      factionId: 'empire',
      threatAssessment: 3,
      bastionClearance: 2,
      cardId: null,
      iccNumber: null,
      assignedDisplayName: 'Alex Crew',
    })
  })

  it('rejects duplicates that disagree on character data', () => {
    expect(() =>
      normalizeFigurants([
        rawFigurant(),
        rawFigurant({ character_name: 'A different character' }),
      ]),
    ).toThrowError(ContractError)
  })

  it('rejects values outside the observed numeric ranges', () => {
    expect(() =>
      normalizeFigurants([rawFigurant({ threat_assessment: '6' })]),
    ).toThrow('Invalid threat_assessment')
  })
})

describe('normalizeSession', () => {
  it('normalizes Joomla values and recognizes a configured manager group', () => {
    expect(normalizeSession({ id: 71, groups: [2, '30', '30'] }, ['30'])).toEqual({
      externalUserId: '71',
      groupIds: ['2', '30'],
      authenticated: true,
      canManageFigurants: true,
      role: 'manager',
    })
  })

  it('treats Joomla user zero as a guest even if groups are returned', () => {
    expect(normalizeSession({ id: 0, groups: ['30'] }, ['30'])).toMatchObject({
      authenticated: false,
      canManageFigurants: false,
      role: 'guest',
    })
  })

  it('accepts the deployed null-groups shape for an anonymous user', () => {
    expect(normalizeSession({ id: 0, groups: null }, ['30'])).toEqual({
      externalUserId: '0',
      groupIds: [],
      authenticated: false,
      canManageFigurants: false,
      role: 'guest',
    })
  })

  it('rejects null groups for an authenticated user', () => {
    expect(() => normalizeSession({ id: 71, groups: null }, ['30'])).toThrow(
      'getSession.groups must return an array',
    )
  })
})

describe('normalizeAffectedRows', () => {
  it('accepts non-negative numeric mutation results', () => {
    expect(normalizeAffectedRows(0, 'assignFigurant')).toBe(0)
    expect(normalizeAffectedRows('2', 'assignFigurant')).toBe(2)
  })

  it('rejects missing or malformed mutation results', () => {
    expect(() => normalizeAffectedRows(null, 'assignFigurant')).toThrow(
      ContractError,
    )
    expect(() => normalizeAffectedRows('-1', 'assignFigurant')).toThrow(
      ContractError,
    )
  })
})
