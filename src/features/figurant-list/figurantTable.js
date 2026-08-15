export const figurantColumns = [
  { key: 'cardId', label: 'RFID card' },
  { key: 'factionId', label: 'Faction' },
  { key: 'characterName', label: 'Name' },
  { key: 'recurring', label: 'Recurring?' },
  { key: 'plotReference', label: 'Plot' },
  { key: 'assignedDisplayName', label: 'Assigned' },
]

export function formatFigurantCell(figurant, key) {
  if (key === 'characterName') {
    return [figurant.rank, figurant.characterName].filter(Boolean).join(' ')
  }
  if (key === 'recurring') return figurant.recurring ? 'recurring' : 'single'
  if (key === 'assignedDisplayName') {
    return (
      figurant.assignedDisplayName ??
      (figurant.assignedExternalUserId
        ? `User ${figurant.assignedExternalUserId}`
        : 'Unassigned')
    )
  }
  if (key === 'cardId') return figurant.cardId ?? 'Not scanned'
  return figurant[key] == null ? '' : String(figurant[key])
}

export function getVisibleFigurants(
  figurants,
  filters,
  sortKey,
  sortDirection,
) {
  return figurants
    .filter((figurant) =>
      figurantColumns.every((column) => {
        const filter = String(filters[column.key] ?? '').trim().toLowerCase()
        return (
          !filter ||
          formatFigurantCell(figurant, column.key).toLowerCase().includes(filter)
        )
      }),
    )
    .sort((left, right) => {
      const comparison = formatFigurantCell(left, sortKey).localeCompare(
        formatFigurantCell(right, sortKey),
        undefined,
        { numeric: true, sensitivity: 'base' },
      )
      return sortDirection === 'asc' ? comparison : -comparison
    })
}
