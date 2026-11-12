function pick(values, random) {
  if (!Array.isArray(values) || values.length === 0) return ''
  return String(values[Math.floor(random() * values.length)] ?? '')
}

function separatorFor(data, index) {
  if (index === 0) return ''
  const separator = String(data.concatinationSymbol?.[index - 1] ?? '')
  return separator.endsWith(' ') || separator.endsWith('-')
    ? separator
    : `${separator} `
}

export function generateFactionName(data, random = Math.random) {
  if (!data || !Array.isArray(data.desiredOutput)) return ''

  let name = ''
  data.desiredOutput.forEach((field, index) => {
    const chance = Number(data.chanceOfOutput?.[index] ?? 1)
    if (random() <= 1 - chance) return

    const value = pick(data[field], random)
    if (!value) return
    if (name) name += separatorFor(data, index)
    name += value
  })
  return name.trim()
}

export function generateFactionNames(data, amount, random = Math.random) {
  return Array.from({ length: amount }, () => generateFactionName(data, random))
}

export function replaceDugoSurname(name, asulNames, random = Math.random) {
  const parts = String(name).trim().split(/\s+/)
  if (parts.length < 2 || !Array.isArray(asulNames) || asulNames.length === 0) {
    return name
  }
  parts[1] = pick(asulNames, random)
  return parts.join(' ')
}
