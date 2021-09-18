import { readable } from 'svelte/store'
import environment from '../../environment.js'
import aquilaData from '../../factiondata/aquila.json'
import dugoData from '../../factiondata/dugo.json'
import ekaneshData from '../../factiondata/ekanesh.json'
import pendzalData from '../../factiondata/pendzal.json'
import sonaData from '../../factiondata/sona.json'

const allFactionsDataArray = [
  {
    dugo: dugoData,
    aquila: aquilaData,
    ekanesh: ekaneshData,
    pendzal: pendzalData,
    sona: sonaData,
  },
]

async function getGroupID(groupName) {
  await fetch(environment.orthanc + 'joomla/groups/', {
    method: 'GET',
    mode: 'cors',
    headers: {
      token: environment.token,
      name: groupName,
      'cache-control': 'no-cache',
    },
  }).then(async function (response) {
    if (response.status == 200) {
      let group = await response.json()
      return group
    } else {
      console.log('[getGroupID] something went wrong')
    }
  })
}

async function getUsersBasedonID() {
  await fetch(environment.orthanc + 'joomla/users/', {
    method: 'GET',
    mode: 'cors',
    headers: {
      token: environment.token,
      // to prevent double async fetches, the group id for monsterland (29) is hardcoded here
      group_id: 29,
      'cache-control': 'no-cache',
    },
  }).then(async function (response) {
    if (response.status == 200) {
      let list = await response.json()
      return list
    } else {
      console.log('[getUsersBasedonID] something went wrong')
    }
  })
}

export const allFactionsStoreArray = readable(allFactionsDataArray)
export const ocFigurantenStoreArray = readable(getUsersBasedonID())
