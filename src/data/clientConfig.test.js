import { describe, expect, it } from 'vitest'
import { readClientConfig } from './clientConfig.js'

describe('readClientConfig', () => {
  it('defaults to safe mock mode', () => {
    expect(readClientConfig({})).toMatchObject({
      mode: 'mock',
      groupName: 'monsterland',
      mockDelayMs: 150,
    })
  })

  it('accepts live mode without accepting a browser API token', () => {
    const config = readClientConfig({
      VITE_DATA_SOURCE: 'live',
      VITE_ORTHANC_FIGURANT_GROUP_NAME: 'Crew',
    })

    expect(config).toMatchObject({ mode: 'live', groupName: 'Crew' })
    expect(config).not.toHaveProperty('token')
  })

  it('rejects an unsupported mode', () => {
    expect(() => readClientConfig({ VITE_DATA_SOURCE: 'production' })).toThrow(
      'VITE_DATA_SOURCE must be either',
    )
  })
})
