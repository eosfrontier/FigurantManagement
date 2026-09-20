import { useState } from 'react'
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

export default function NameGenerator() {
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
    <section className="name-generator" aria-labelledby="name-generator-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Preparation utility</p>
          <h2 id="name-generator-title">Faction name generator</h2>
          <p className="section-intro">
            Generate editable name suggestions using the familiar faction sets.
          </p>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={() => setNamesByFaction(generateAllNames())}
        >
          Roll new names
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
                      className="button button--compact"
                      type="button"
                      onClick={() => makeAsul(index)}
                    >
                      Make Asul
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
