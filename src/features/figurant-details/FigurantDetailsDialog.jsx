import { useEffect, useMemo, useRef, useState } from 'react'
import { getUserFacingError } from '../../api/errors.js'
import {
  BLOOD_TYPES,
  CUSTOMS_DISPOSITIONS,
  FIGURANT_FACTIONS,
  generateIccNumber,
  normalizePreparedFigurantDraft,
} from '../../domain/figurantDraft.js'
import {
  FALLBACK_IN_GAME_DATE,
  ageOnDate,
  birthDateForAge,
  parseInGameBirthDate,
} from '../../domain/inGameBirthDate.js'
import { factionData } from '../name-generator/factionData.js'

function initialDraft(figurant = null, initialValues = null) {
  if (figurant) {
    const factionId = figurant.factionId
    return {
      characterName: figurant.characterName,
      factionId,
      rank: figurant.rank ?? '',
      threatAssessment: figurant.threatAssessment,
      customsDisposition: figurant.customsDisposition,
      customsNotes: figurant.customsNotes ?? '',
      bastionClearance: figurant.bastionClearance,
      iccNumber: figurant.iccNumber ?? '',
      bloodType:
        figurant.bloodType ?? factionData[factionId]?.bloodTypes[0] ?? 'O',
      age: '',
      birthDate: figurant.birthDate ?? '',
      homePlanet:
        figurant.homePlanet ?? factionData[factionId]?.homePlanets[0] ?? '',
      plotReference: figurant.plotReference ?? '',
      recurring: figurant.recurring,
    }
  }

  const requestedFactionId = String(initialValues?.factionId ?? '').toLowerCase()
  const factionId = FIGURANT_FACTIONS.includes(requestedFactionId)
    ? requestedFactionId
    : FIGURANT_FACTIONS[0]
  return {
    characterName: String(initialValues?.characterName ?? ''),
    factionId,
    rank: '',
    threatAssessment: 0,
    customsDisposition: 'ACCESS GRANTED',
    customsNotes: '',
    bastionClearance: 0,
    iccNumber: '',
    bloodType: factionData[factionId].bloodTypes[0],
    age: '',
    birthDate: '',
    homePlanet: factionData[factionId].homePlanets[0],
    plotReference: '',
    recurring: false,
  }
}

async function findUniqueIccNumber(manager, factionId) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateIccNumber(factionId)
    if (await manager.isIccNumberAvailable(candidate)) return candidate
  }
  throw new Error('No unique ICC number could be generated after 20 attempts.')
}

export default function FigurantDetailsDialog({
  open,
  manager,
  figurant = null,
  initialValues = null,
  generateIccOnOpen = false,
  assignableUsers = [],
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
  deletionBlockedReason = null,
}) {
  const [draft, setDraft] = useState(initialDraft)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [inGameDate, setInGameDate] = useState(FALLBACK_IN_GAME_DATE)
  const [assignedExternalUserId, setAssignedExternalUserId] = useState('')
  const [cardId, setCardId] = useState('')
  const nameInput = useRef(null)
  const ageSource = useRef(null)
  const homePlanets = useMemo(
    () => {
      const configured = factionData[draft.factionId]?.homePlanets ?? []
      return draft.homePlanet && !configured.includes(draft.homePlanet)
        ? [draft.homePlanet, ...configured]
        : configured
    },
    [draft.factionId, draft.homePlanet],
  )
  const editing = Boolean(figurant)

  useEffect(() => {
    if (!open) return
    let active = true
    const nextDraft = initialDraft(figurant, initialValues)
    setDraft(nextDraft)
    setStatus(generateIccOnOpen && !figurant ? 'generating' : 'idle')
    setMessage(null)
    setConfirmingDelete(false)
    setInGameDate(FALLBACK_IN_GAME_DATE)
    setAssignedExternalUserId(figurant?.assignedExternalUserId ?? '')
    setCardId(figurant?.cardId ?? '')
    ageSource.current = figurant?.birthDate ? 'birth' : null
    requestAnimationFrame(() => nameInput.current?.focus())
    void manager.getCurrentInGameDate().then((date) => {
      if (active) setInGameDate(date)
    })
    if (generateIccOnOpen && !figurant) {
      void findUniqueIccNumber(manager, nextDraft.factionId)
        .then((iccNumber) => {
          if (!active) return
          setDraft((current) => ({ ...current, iccNumber }))
          setStatus('idle')
        })
        .catch((error) => {
          if (!active) return
          console.error(error)
          setMessage(
            getUserFacingError(error, {
              fallback: error.message || 'The ICC number could not be generated.',
            }),
          )
          setStatus('idle')
        })
    }
    return () => {
      active = false
    }
  }, [figurant, generateIccOnOpen, initialValues, manager, open])

  useEffect(() => {
    if (!open || !ageSource.current) return
    setDraft((current) => {
      if (ageSource.current === 'age' && current.age !== '') {
        return {
          ...current,
          birthDate:
            birthDateForAge(current.age, inGameDate, current.birthDate) ??
            current.birthDate,
        }
      }
      if (ageSource.current === 'birth') {
        const birthDate = parseInGameBirthDate(current.birthDate)
        return {
          ...current,
          age: birthDate ? String(ageOnDate(birthDate, inGameDate) ?? '') : '',
        }
      }
      return current
    })
  }, [inGameDate, open])

  useEffect(() => {
    if (!open) return undefined
    function closeOnEscape(event) {
      if (event.key === 'Escape' && status === 'idle') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open, status])

  if (!open) return null

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function changeFaction(factionId) {
    setDraft((current) => ({
      ...current,
      factionId,
      iccNumber: '',
      homePlanet: factionData[factionId].homePlanets[0],
      bloodType: factionData[factionId].bloodTypes[0],
    }))
  }

  function changeAge(value) {
    ageSource.current = 'age'
    setDraft((current) => ({
      ...current,
      age: value,
      birthDate:
        value === ''
          ? current.birthDate
          : birthDateForAge(value, inGameDate, current.birthDate) ??
            current.birthDate,
    }))
  }

  function changeBirthDate(value) {
    ageSource.current = 'birth'
    const parsed = parseInGameBirthDate(value)
    setDraft((current) => ({
      ...current,
      birthDate: value,
      age: parsed ? String(ageOnDate(parsed, inGameDate) ?? '') : '',
    }))
  }

  async function generateUniqueIccNumber() {
    setStatus('generating')
    setMessage(null)
    try {
      update('iccNumber', await findUniqueIccNumber(manager, draft.factionId))
      setStatus('idle')
    } catch (error) {
      console.error(error)
      setMessage(
        getUserFacingError(error, {
          fallback: error.message || 'The ICC number could not be generated.',
        }),
      )
      setStatus('idle')
    }
  }

  async function submit(event) {
    event.preventDefault()
    setStatus('saving')
    setMessage(null)

    try {
      const normalized = normalizePreparedFigurantDraft(draft)
      const iccNumberChanged = normalized.iccNumber !== figurant?.iccNumber
      if (
        (!editing || iccNumberChanged) &&
        !(await manager.isIccNumberAvailable(normalized.iccNumber))
      ) {
        throw new Error('That ICC number is already in use. Generate a new one.')
      }
      if (editing) {
        await onUpdated(figurant, normalized, {
          assignedExternalUserId: assignedExternalUserId || null,
          cardId: cardId.trim() || null,
        })
      } else {
        const creation = await manager.createPreparedFigurant(normalized)
        await onCreated(creation, {
          assignedExternalUserId: assignedExternalUserId || null,
          cardId: cardId.trim() || null,
        })
      }
    } catch (error) {
      console.error(error)
      setMessage(
        getUserFacingError(error, {
          fallback:
            error.message ||
            `The character could not be ${editing ? 'updated' : 'created'}.`,
        }),
      )
      setStatus('idle')
    }
  }

  async function deleteCharacter() {
    setStatus('deleting')
    setMessage(null)
    try {
      await onDeleted(figurant)
    } catch (error) {
      console.error(error)
      setMessage(
        error?.retryable || error?.name === 'AbortError'
          ? 'The archive outcome is uncertain. Refresh the roster before trying again.'
          : getUserFacingError(error, {
              fallback:
                error.message ||
                'The character could not be deleted. Check the roster before trying again.',
            }),
      )
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'
  const currentAssignmentIsMissing =
    assignedExternalUserId &&
    !assignableUsers.some(
      (user) => user.externalUserId === assignedExternalUserId,
    )

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <section
        className="character-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-dialog-title"
      >
        <header className="character-dialog__header">
          <div>
            <p className="eyebrow">{editing ? 'Existing role' : 'New role'}</p>
            <h2 id="character-dialog-title">
              {editing ? 'Edit character' : 'Create a new character'}
            </h2>
            <p>
              {editing
                ? 'Update the character and customs information.'
                : 'Create the character record now.'}
            </p>
          </div>
          <button
            className="character-dialog__close"
            type="button"
            aria-label="Close character details"
            disabled={busy}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="character-dialog__grid">
            <fieldset>
              <legend>Identity</legend>
              <label>
                <span>Character name</span>
                <input
                  ref={nameInput}
                  required
                  maxLength={255}
                  value={draft.characterName}
                  onChange={(event) =>
                    update('characterName', event.currentTarget.value)
                  }
                />
              </label>
              <label>
                <span>Rank or job</span>
                <input
                  maxLength={255}
                  value={draft.rank}
                  onChange={(event) => update('rank', event.currentTarget.value)}
                />
              </label>
              <label>
                <span>Faction</span>
                <select
                  value={draft.factionId}
                  onChange={(event) => changeFaction(event.currentTarget.value)}
                >
                  {FIGURANT_FACTIONS.map((factionId) => (
                    <option key={factionId} value={factionId}>
                      {factionId}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>ICC number</span>
                <span className="field-with-action">
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{4} [0-9]{5} [0-9]{4}"
                    placeholder="1234 12345 1234"
                    value={draft.iccNumber}
                    onChange={(event) =>
                      update('iccNumber', event.currentTarget.value)
                    }
                  />
                  <button
                    className="button button--compact"
                    type="button"
                    disabled={busy}
                    onClick={() => void generateUniqueIccNumber()}
                  >
                    {status === 'generating' ? 'Generating…' : 'Generate'}
                  </button>
                </span>
              </label>
              <label>
                <span>Plot reference</span>
                <input
                  maxLength={32}
                  placeholder="Plot number and name"
                  value={draft.plotReference}
                  onChange={(event) =>
                    update('plotReference', event.currentTarget.value)
                  }
                />
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.recurring}
                  onChange={(event) =>
                    update('recurring', event.currentTarget.checked)
                  }
                />
                <span>Recurring character</span>
              </label>
            </fieldset>

            <fieldset>
              <legend>Access and customs</legend>
              <label>
                <span>Threat assessment: {draft.threatAssessment}</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={draft.threatAssessment}
                  onChange={(event) =>
                    update('threatAssessment', event.currentTarget.value)
                  }
                />
              </label>
              <label>
                <span>Bastion clearance: {draft.bastionClearance}</span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={draft.bastionClearance}
                  onChange={(event) =>
                    update('bastionClearance', event.currentTarget.value)
                  }
                />
              </label>
              <label>
                <span>Customs disposition</span>
                <select
                  value={draft.customsDisposition}
                  onChange={(event) =>
                    update('customsDisposition', event.currentTarget.value)
                  }
                >
                  {CUSTOMS_DISPOSITIONS.map((disposition) => (
                    <option key={disposition} value={disposition}>
                      {disposition}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Customs notes</span>
                <textarea
                  rows="3"
                  maxLength={2000}
                  value={draft.customsNotes}
                  onChange={(event) =>
                    update('customsNotes', event.currentTarget.value)
                  }
                />
              </label>
            </fieldset>

            <fieldset>
              <legend>Personal record</legend>
              <label>
                <span>Age</span>
                <input
                  type="number"
                  min="0"
                  max={inGameDate.year}
                  inputMode="numeric"
                  value={draft.age}
                  onChange={(event) => changeAge(event.currentTarget.value)}
                />
              </label>
              <label>
                <span>Birth date</span>
                <input
                  required
                  maxLength={64}
                  placeholder="For example 15-7-220NT"
                  value={draft.birthDate}
                  onChange={(event) =>
                    changeBirthDate(event.currentTarget.value)
                  }
                />
              </label>
              <p className="in-game-date-hint">
                Current in-game date: {inGameDate.day}-{inGameDate.month}-
                {inGameDate.yearPrefix}{inGameDate.year}{inGameDate.yearSuffix}
                {inGameDate.fallback ? ' (fallback)' : ''}
              </p>
              <label>
                <span>Home planet</span>
                <select
                  value={draft.homePlanet}
                  onChange={(event) =>
                    update('homePlanet', event.currentTarget.value)
                  }
                >
                  {homePlanets.map((planet) => (
                    <option key={planet} value={planet}>
                      {planet}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Blood type</span>
                <select
                  value={draft.bloodType}
                  onChange={(event) =>
                    update('bloodType', event.currentTarget.value)
                  }
                >
                  {BLOOD_TYPES.map((bloodType) => (
                    <option key={bloodType} value={bloodType}>
                      {bloodType}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Assigned NPC</span>
                <select
                  value={assignedExternalUserId}
                  onChange={(event) =>
                    setAssignedExternalUserId(event.currentTarget.value)
                  }
                >
                  <option value="">Unassigned</option>
                  {currentAssignmentIsMissing && (
                    <option value={assignedExternalUserId}>
                      {figurant?.assignedDisplayName ??
                        `User ${assignedExternalUserId}`} (currently assigned)
                    </option>
                  )}
                  {assignableUsers.map((user, index) => (
                    <option
                      key={`${user.externalUserId}-${user.displayName}-${index}`}
                      value={user.externalUserId}
                    >
                      {user.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>RFID card</span>
                <input
                  type="text"
                  value={cardId}
                  autoComplete="one-time-code"
                  maxLength={64}
                  pattern="[A-Za-z0-9:-]+"
                  placeholder="Scan an RFID card"
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => setCardId(event.currentTarget.value)}
                />
              </label>
              {editing && figurant.cardId && (
                <p className="field-hint">
                  Scan a replacement card. An unchanged or empty field keeps the
                  current card.
                </p>
              )}
            </fieldset>
          </div>

          {message && (
            <p className="alert alert--error" role="alert">{message}</p>
          )}
          {confirmingDelete && (
            <div className="delete-confirmation" role="alert">
              <p>
                <strong>Archive {figurant.characterName}?</strong>
              </p>
              <p>
                This removes the character from the active roster and releases
                its RFID card. The record remains restorable in Orthanc.
              </p>
              <div>
                <button
                  className="button button--quiet"
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Keep character
                </button>
                <button
                  className="button button--danger"
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteCharacter()}
                >
                  {status === 'deleting' ? 'Archiving…' : 'Confirm archive'}
                </button>
              </div>
            </div>
          )}
          {editing && !confirmingDelete && deletionBlockedReason && (
            <p
              className="character-dialog__delete-note"
              id="character-delete-blocked-reason"
            >
              {deletionBlockedReason}
            </p>
          )}
          {!confirmingDelete && (
            <footer className="character-dialog__actions">
              {editing && (
                <button
                  className="button button--danger character-dialog__delete"
                  type="button"
                  disabled={busy || Boolean(deletionBlockedReason)}
                  title={deletionBlockedReason ?? undefined}
                  aria-describedby={
                    deletionBlockedReason
                      ? 'character-delete-blocked-reason'
                      : undefined
                  }
                  onClick={() => setConfirmingDelete(true)}
                >
                  Archive character
                </button>
              )}
              <button
                className="button button--quiet"
                type="button"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="button button--primary"
                type="submit"
                disabled={busy}
              >
                {status === 'saving'
                  ? editing
                    ? 'Queuing changes…'
                    : 'Creating character…'
                  : editing
                    ? 'Queue changes'
                    : 'Create character'}
              </button>
            </footer>
          )}
        </form>
      </section>
    </div>
  )
}
