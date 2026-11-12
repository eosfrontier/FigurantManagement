import { describe, expect, it } from 'vitest'
import {
  ageOnDate,
  birthDateForAge,
  parseInGameBirthDate,
} from './inGameBirthDate.js'

const currentDate = {
  year: 240,
  month: 6,
  day: 10,
  yearPrefix: '',
  yearSuffix: 'NT',
}

describe('in-game birth dates', () => {
  it('calculates age before and after the birthday', () => {
    expect(ageOnDate(parseInGameBirthDate('9-6-220NT'), currentDate)).toBe(20)
    expect(ageOnDate(parseInGameBirthDate('11-6-220NT'), currentDate)).toBe(19)
  })

  it('preserves a birthday day and month when changing age', () => {
    expect(birthDateForAge(30, currentDate, '11-8-220NT')).toBe('11-8-209NT')
    expect(birthDateForAge(30, currentDate, '1-2-220NT')).toBe('1-2-210NT')
  })

  it('uses the current in-game day and month when no birthday exists', () => {
    expect(birthDateForAge(25, currentDate, '')).toBe('10-6-215NT')
  })

  it('rejects malformed or impossible dates', () => {
    expect(parseInGameBirthDate('31-2-220NT')).toBeNull()
    expect(parseInGameBirthDate('not a date')).toBeNull()
  })
})
