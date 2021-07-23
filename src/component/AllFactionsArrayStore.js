import { writable } from 'svelte/store'
import aquilaData from '../../factiondata/aquila.json'
import dugoData from '../../factiondata/dugo.json'
import ekaneshData from '../../factiondata/ekanesh.json'
import pendzalData from '../../factiondata/pendzal.json'
import sonaData from '../../factiondata/sona.json'

const allFactionsDataArray = [
  {
    aquila: aquilaData,
    dugo: dugoData,
    ekanesh: ekaneshData,
    pendzal: pendzalData,
    sona: sonaData,
  },
]

export const allFactionsStoreArray = writable(allFactionsDataArray)
