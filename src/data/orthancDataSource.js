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

function detailsToRawPayload(details) {
  return {
    character_name: details.characterName,
    faction: details.factionId,
    rank: details.rank,
    threat_assessment: details.threatAssessment,
    douane_disposition: details.customsDisposition,
    douane_notes: details.customsNotes ?? '',
    bastion_clearance: details.bastionClearance,
    icc_number: details.iccNumber,
    bloodtype: details.bloodType,
    ic_birthday: details.birthDate,
    homeplanet: details.homePlanet,
    plotname: details.plotReference,
    recurring: details.recurring,
  }
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

    async updateFigurantDetails(
      { characterId, details },
      { signal } = {},
    ) {
      const normalized = normalizePreparedFigurantDraft(details)
      const affectedRows = normalizeAffectedRows(
        await client.updateFigurantDetails(
          characterId,
          detailsToRawPayload(normalized),
          { signal },
        ),
        'updateFigurantDetails',
      )

      return {
        characterId: String(characterId),
        details: normalized,
        affectedRows,
      }
    },

    async createPreparedFigurant(draft, { signal } = {}) {
      const normalized = normalizePreparedFigurantDraft(draft)
      const rawPayload = {
        card_id: null,
        ...detailsToRawPayload(normalized),
        figu_accountID: null,
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
