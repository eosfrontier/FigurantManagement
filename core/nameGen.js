const fs = require('fs')
const { DefaultAmount, Factions, MaxAmount } = require('../config')

// Validation rules & defaults for the HTTP Query
const _checkFaction = (faction = '') => Factions.includes(faction.toLowerCase())
const _enforceNumber = (input) => {
  const amount = parseInt(input)
  return amount && typeof amount === 'number' ? amount : DefaultAmount
}
const _enforceLimit = (amount = DefaultAmount) =>
  amount > MaxAmount ? MaxAmount : amount
const _parseQuery = (query) => {
  return {
    amount: _enforceLimit(_enforceNumber(query.amount)),
    faction: (_checkFaction(query.faction)
      ? query.faction
      : 'aquila'
    ).toLowerCase(),
  }
}

// namelist private functions
const _loadFactionList = (factionName) =>
  JSON.parse(fs.readFileSync(`./namelists/${factionName}.json`))
const _getRandomArrayItem = (array) =>
  array[Math.floor(Math.random() * array.length)]

// Create a single name based on the 'desiredOutput' field in the nameList JSON
const _createNameFromList = (nameList) => {
  let name = ''
  nameList.desiredOutput.map((part) => {
    name += _getRandomArrayItem(nameList[part])
  })
  return name
}

// create an array containing X names based on nameList
const _createNameArray = (nameList, amount) => {
  const nameArr = []
  for (i = 0; i < amount; i++) {
    nameArr[i] = _createNameFromList(nameList)
  }
  return nameArr
}

// public function that ties it all together
function generateNames(query = {}) {
  const cleanQuery = _parseQuery(query)
  const nameList = _loadFactionList(cleanQuery.faction)
  return _createNameArray(nameList, cleanQuery.amount)
}

module.exports = {
  generateNames,
}
