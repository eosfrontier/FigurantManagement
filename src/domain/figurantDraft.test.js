import { describe, expect, it } from 'vitest'
import {
  generateIccNumber,
  normalizePreparedFigurantDraft,
} from './figurantDraft.js'

const validDraft = {
  characterName: 'Mara Venn',
  factionId: 'aquila',
  rank: 'Courier',
  threatAssessment: '2',
  customsDisposition: 'ACCESS GRANTED',
  customsNotes: '',
  bastionClearance: '1',
  iccNumber: '7002 10000 0000',
  bloodType: 'O',
  birthDate: '15-7-220NT',
  homePlanet: 'Accipiter',
  plotReference: '',
  recurring: false,
}

describe('prepared figurant drafts', () => {
  it('normalizes a prepared role without card or assignment data', () => {
    expect(normalizePreparedFigurantDraft(validDraft)).toMatchObject({
      characterName: 'Mara Venn',
      factionId: 'aquila',
      threatAssessment: 2,
      bastionClearance: 1,
      customsNotes: null,
      plotReference: null,
    })
  })

  it('rejects unsupported factions and malformed ICC numbers', () => {
    expect(() =>
      normalizePreparedFigurantDraft({ ...validDraft, factionId: 'unknown' }),
    ).toThrow('supported factions')
    expect(() =>
      normalizePreparedFigurantDraft({ ...validDraft, iccNumber: '123' }),
    ).toThrow('1234 12345 1234')
  })

  it('generates a faction-prefixed ICC number with a valid Luhn check digit', () => {
    const iccNumber = generateIccNumber('aquila', {
      now: new Date(2026, 0, 2, 12),
      random: () => 0,
    })
    const digits = iccNumber.replaceAll(' ', '')
    let sum = 0
    let shouldDouble = false
    for (let index = digits.length - 1; index >= 0; index -= 1) {
      let digit = Number(digits[index])
      if (shouldDouble && (digit *= 2) > 9) digit -= 9
      sum += digit
      shouldDouble = !shouldDouble
    }

    expect(iccNumber).toMatch(/^7002 \d{5} \d{4}$/)
    expect(sum % 10).toBe(0)
  })
})
