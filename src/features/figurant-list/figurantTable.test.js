import { describe, expect, it } from 'vitest'
import { getVisibleFigurants } from './figurantTable.js'

const figurants = [
  {
    characterId: '2',
    characterName: 'Zara',
    rank: null,
    factionId: 'sona',
    recurring: false,
    cardId: null,
    plotReference: null,
    assignedExternalUserId: null,
    assignedDisplayName: null,
  },
  {
    characterId: '1',
    characterName: 'Ada',
    rank: 'Captain',
    factionId: 'aquila',
    recurring: true,
    cardId: 'CARD-1',
    plotReference: 'Arrival',
    assignedExternalUserId: '4',
    assignedDisplayName: 'Alex Crew',
  },
]

describe('getVisibleFigurants', () => {
  it('filters each normalized display column', () => {
    expect(
      getVisibleFigurants(figurants, { assignedDisplayName: 'alex' }, 'characterName', 'asc'),
    ).toEqual([figurants[1]])
  })

  it('sorts display values without mutating the source array', () => {
    const result = getVisibleFigurants(figurants, {}, 'characterName', 'asc')
    expect(result.map((item) => item.characterId)).toEqual(['1', '2'])
    expect(figurants.map((item) => item.characterId)).toEqual(['2', '1'])
  })
})
