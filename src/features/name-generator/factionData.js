import config from '../../../config.js'
import aquila from '../../../factiondata/aquila.json'
import dugo from '../../../factiondata/dugo.json'
import ekanesh from '../../../factiondata/ekanesh.json'
import hasiru from '../../../factiondata/hasiru.json'
import kadu from '../../../factiondata/kadu.json'
import pendzal from '../../../factiondata/pendzal.json'
import sona from '../../../factiondata/sona.json'

export const factionOrder = [...config.Factions]
export const defaultNameCount = config.DefaultAmount

export const factionData = {
  aquila,
  dugo,
  ekanesh,
  hasiru,
  kadu,
  pendzal,
  sona,
}
