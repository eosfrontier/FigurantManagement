import { readable } from 'svelte/store'
import environment from '../../environment.js'
import aquilaData from '../../factiondata/aquila.json'
import dugoData from '../../factiondata/dugo.json'
import ekaneshData from '../../factiondata/ekanesh.json'
import pendzalData from '../../factiondata/pendzal.json'
import sonaData from '../../factiondata/sona.json'
import kaduData from '../../factiondata/kadu.json'
import hasiruData from '../../factiondata/hasiru.json'

const allFactionsDataArray = [
  {
    dugo: dugoData,
    aquila: aquilaData,
    ekanesh: ekaneshData,
    pendzal: pendzalData,
    sona: sonaData,
    kadu: kaduData,
    hasiru: hasiruData,
  },
]

async function getGroupID(groupName) {
  try {
    const response = await fetch(environment.orthanc + 'joomla/groups/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        name: groupName,
        'cache-control': 'no-cache',
      },
    })
    if (response.ok) {
      return await response.json()
    }
    console.log('[getGroupID] something went wrong')
  } catch (error) {
    console.error('[getGroupID] Fetch failed:', error)
  }
  return null
}

async function getUsersBasedonID() {
  try {
    const response = await fetch(environment.orthanc + 'joomla/users/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        token: environment.token,
        // to prevent double async fetches, the group id for monsterland (29) is hardcoded here
        group_id: 29,
        'cache-control': 'no-cache',
      },
    })
    if (response.ok) {
      return await response.json()
    }
    console.log('[getUsersBasedonID from store] something went wrong')
  } catch (error) {
    console.error('[getUsersBasedonID from store] Fetch failed:', error)
  }
  return []
}

export const allFactionsStoreArray = readable(allFactionsDataArray)
export const ocFigurantenStoreArray = readable([], (set) => {
  getUsersBasedonID().then((data) => set(data || []))
})
