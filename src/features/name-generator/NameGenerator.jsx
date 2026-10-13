import { useState } from 'react'
import Icon from '../../Icon.jsx'
import {
  defaultNameCount,
  factionData,
  factionOrder,
} from './factionData.js'
import {
  generateFactionNames,
  replaceDugoSurname,
} from './nameGenerator.js'

function generateAllNames() {
  return Object.fromEntries(
    factionOrder.map((factionId) => [
      factionId,
      generateFactionNames(factionData[factionId], defaultNameCount),
    ]),
  )
}

export default function NameGenerator({ onCreateCharacter = null }) {
  const [namesByFaction, setNamesByFaction] = useState(generateAllNames)

  function updateName(factionId, index, value) {
    setNamesByFaction((current) => ({
      ...current,
      [factionId]: current[factionId].map((name, nameIndex) =>
        nameIndex === index ? value : name,
      ),
    }))
  }

  function makeAsul(index) {
    setNamesByFaction((current) => ({
      ...current,
      dugo: current.dugo.map((name, nameIndex) =>
        nameIndex === index
          ? replaceDugoSurname(name, factionData.dugo.asulNames)
          : name,
      ),
    }))
  }

  return (
    <section className="name-generator" aria-label="Faction name suggestions">
      <div className="name-generator__toolbar">
        <button
          className="button button--primary icon-button"
          type="button"
          aria-label="Roll new names"
          title="Roll new names"
          onClick={() => setNamesByFaction(generateAllNames())}
        >
          <Icon name="dice" />
        </button>
      </div>

      <div className="name-generator__factions">
        {factionOrder.map((factionId) => (
          <section
            className={`name-generator__faction name-generator__faction--${factionId}`}
            key={factionId}
          >
            <h3>{factionId}</h3>
            <ol>
              {namesByFaction[factionId].map((name, index) => (
                <li key={`${factionId}-${index}`}>
                  <label>
                    <span>{factionId} name {index + 1}</span>
                    <input
                      aria-label={`${factionId} name ${index + 1}`}
                      value={name}
                      onChange={(event) =>
                        updateName(factionId, index, event.currentTarget.value)
                      }
                    />
                  </label>
                  {factionId === 'dugo' && (
                    <button
                      className="button button--compact icon-button"
                      type="button"
                      aria-label={`Make ${name} Asul`}
                      title="Make Asul"
                      onClick={() => makeAsul(index)}
                    >
                      <Icon name="crown" size={16} />
                    </button>
                  )}
                  {onCreateCharacter && (
                    <button
                      className="button button--compact icon-button"
                      type="button"
                      aria-label={`Create character from ${name}`}
                      title="Create character"
                      onClick={() =>
                        onCreateCharacter({ factionId, characterName: name })
                      }
                    >
                      <Icon name="userPlus" size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  )
}
