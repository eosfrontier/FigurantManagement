import { useEffect, useRef, useState } from 'react'
import Icon from '../../Icon.jsx'

const CARD_ID_PATTERN = /^[A-Za-z0-9:-]+$/

export default function RfidScanDialog({ open, subject, onCancel, onScan }) {
  const [cardId, setCardId] = useState('')
  const [status, setStatus] = useState('waiting')
  const [message, setMessage] = useState(null)
  const dialogRef = useRef(null)
  const captureRef = useRef(null)

  function focusCapture() {
    captureRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return undefined

    setCardId('')
    setStatus('waiting')
    setMessage(null)
    focusCapture()

    function keepFocusInScanner(event) {
      if (!dialogRef.current?.contains(event.target)) focusCapture()
    }

    document.addEventListener('focusin', keepFocusInScanner)
    return () => document.removeEventListener('focusin', keepFocusInScanner)
  }, [open])

  if (!open) return null

  async function submitScan() {
    if (status === 'saving') return

    const normalizedCardId = cardId.trim()
    if (
      normalizedCardId.length === 0 ||
      normalizedCardId.length > 64 ||
      !CARD_ID_PATTERN.test(normalizedCardId)
    ) {
      setCardId('')
      setMessage('The reader returned an invalid card code. Please scan again.')
      focusCapture()
      return
    }

    setStatus('saving')
    setMessage(null)
    try {
      const accepted = await onScan(normalizedCardId)
      if (accepted === false) throw new Error('The card could not be accepted.')
    } catch (error) {
      console.error(error)
      setCardId('')
      setStatus('waiting')
      setMessage('The card could not be saved. Please scan it again.')
      focusCapture()
    }
  }

  return (
    <div
      className="rfid-scan-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault()
          focusCapture()
        }
      }}
    >
      <section
        ref={dialogRef}
        className="rfid-scan-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfid-scan-title"
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape' && status !== 'saving') onCancel()
        }}
      >
        <Icon name="card" size={42} />
        <h2 id="rfid-scan-title">Scan RFID card now</h2>
        <p className="rfid-scan-dialog__status" role="status">
          {status === 'saving' ? 'Card detected. Saving…' : 'Waiting for card…'}
        </p>
        {message && <p className="alert alert--error">{message}</p>}
        <input
          ref={captureRef}
          className="rfid-scan-dialog__capture"
          type="text"
          aria-label={`RFID scan capture for ${subject}`}
          value={cardId}
          autoFocus
          autoComplete="one-time-code"
          maxLength={64}
          onChange={(event) => setCardId(event.currentTarget.value)}
          onBlur={(event) => {
            if (!dialogRef.current?.contains(event.relatedTarget)) focusCapture()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Tab') {
              event.preventDefault()
              event.stopPropagation()
              void submitScan()
            }
          }}
        />
        <button
          className="button button--quiet"
          type="button"
          disabled={status === 'saving'}
          onClick={onCancel}
        >
          Cancel
        </button>
      </section>
    </div>
  )
}
