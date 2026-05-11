import { readable } from 'svelte/store'
import environment from '../../environment.js'
import aquilaData from '../../factiondata/aquila.json'
import dugoData from '../../factiondata/dugo.json'
import ekaneshData from '../../factiondata/ekanesh.json'
import pendzalData from '../../factiondata/pendzal.json'
import sonaData from '../../factiondata/sona.json'
import kaduData from '../../factiondata/kadu.json'
import hasiruData from '../../factiondata/hasiru.json'
import { mockOcFigurantenNames } from '../mockPersonaData.js'

// This is a more direct data structure—an object of factions—rather than an
// array containing a single object. I've also renamed the exported store
// to `allFactionsStore` to reflect this.
const allFactionsData = {
  dugo: dugoData,
  aquila: aquilaData,
  ekanesh: ekaneshData,
  pendzal: pendzalData,
  sona: sonaData,
  kadu: kaduData,
  hasiru: hasiruData,
}

/**
 * Fetches the users belonging to the 'monsterland' group (hardcoded ID 29).
 * This data is used for the "Assigned" dropdown in the PersonaTable.
 * The function was renamed from getUsersBasedonID for clarity.
 */
async function getOcFiguranten() {
  if (environment.mockPersonaData) {
    return mockOcFigurantenNames
  }
  try {
    const response = await fetch(environment.orthanc + 'joomla/users/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        // To prevent an extra network call, the group id for 'monsterland' (29) is hardcoded.
        group_id: 29,
        'cache-control': 'no-cache',
      },
    })
    if (response.ok) {
      return await response.json()
    }
    console.error(
      '[getOcFiguranten from store] Failed to fetch users:',
      response.status,
      response.statusText,
    )
  } catch (error) {
    console.error('[getOcFiguranten from store] Fetch failed:', error)
  }
  return []
}

export const allFactionsStore = readable(allFactionsData)
export const ocFigurantenStoreArray = readable([], (set) => {
  getOcFiguranten().then((data) => set(data || []))
})
