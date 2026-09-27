import { ContractError } from '../api/errors.js'
import {
  normalizeAffectedRows,
  normalizeCreatedCharacterId,
  normalizeCurrentEvent,
  normalizeFigurants,
  normalizeGroups,
  normalizeHealth,
  normalizeUsers,
} from '../api/normalizers.js'
import {
  normalizePreparedFigurantDraft,
  preparedDraftToFigurant,
} from '../domain/figurantDraft.js'

function selectGroup(groups, groupName) {
  const matches = groups.filter(
    (group) => group.title.toLowerCase() === groupName.toLowerCase(),
  )

  if (matches.length !== 1) {
    throw new ContractError(
      `Expected exactly one Orthanc group named "${groupName}".`,
      {
        code: matches.length === 0 ? 'GROUP_NOT_FOUND' : 'AMBIGUOUS_GROUP',
        details: { groupName, matchCount: matches.length },
      },
    )
  }
  return matches[0]
}

export function createOrthancDataSource({ client, groupName }) {
  async function getAssignableUsers({ signal } = {}) {
    const groups = normalizeGroups(
      await client.getGroupsByName(groupName, { signal }),
    )
    const group = selectGroup(groups, groupName)
    return normalizeUsers(
      await client.getUsersByGroup(group.id, { currentEvent: true, signal }),
    )
  }

  return {
    async getHealth({ signal } = {}) {
      return normalizeHealth(await client.getHealth({ signal }))
    },

    async getCurrentEvent({ signal } = {}) {
      return normalizeCurrentEvent(await client.getCurrentEvent({ signal }))
    },

    getAssignableUsers,

    async getFigurants({ signal } = {}) {
      const [rawFigurants, users] = await Promise.all([
        client.getActiveFigurants({ signal }),
        getAssignableUsers({ signal }),
      ])
      return {
        ...normalizeFigurants(rawFigurants, users),
        assignableUsers: users,
      }
    },

    async setFigurantAssignment(
      { characterId, assignedExternalUserId },
      { signal } = {},
    ) {
      const affectedRows = normalizeAffectedRows(
        await client.setFigurantAssignment(
          characterId,
          assignedExternalUserId,
          { signal },
        ),
        'setFigurantAssignment',
      )

      return {
        characterId: String(characterId),
        assignedExternalUserId:
          assignedExternalUserId === null
            ? null
            : String(assignedExternalUserId),
        affectedRows,
      }
    },

    async setFigurantCard({ characterId, cardId }, { signal } = {}) {
      const normalizedCardId = String(cardId).trim()
      const affectedRows = normalizeAffectedRows(
        await client.setFigurantCard(characterId, normalizedCardId, { signal }),
        'setFigurantCard',
      )

      return {
        characterId: String(characterId),
        cardId: normalizedCardId,
        affectedRows,
      }
    },

    async isIccNumberAvailable(iccNumber, { signal } = {}) {
      return (await client.getCharacterByIccNumber(iccNumber, { signal })) === null
    },

    async createPreparedFigurant(draft, { signal } = {}) {
      const normalized = normalizePreparedFigurantDraft(draft)
      const rawPayload = {
        card_id: null,
        character_name: normalized.characterName,
        faction: normalized.factionId,
        rank: normalized.rank,
        threat_assessment: normalized.threatAssessment,
        douane_disposition: normalized.customsDisposition,
        douane_notes: normalized.customsNotes ?? '',
        bastion_clearance: normalized.bastionClearance,
        icc_number: normalized.iccNumber,
        bloodtype: normalized.bloodType,
        ic_birthday: normalized.birthDate,
        homeplanet: normalized.homePlanet,
        figu_accountID: null,
        plotname: normalized.plotReference,
        recurring: normalized.recurring,
      }
      const characterId = normalizeCreatedCharacterId(
        await client.createPreparedFigurant(rawPayload, { signal }),
      )
      return {
        characterId,
        figurant: preparedDraftToFigurant(normalized, characterId),
      }
    },
  }
}
