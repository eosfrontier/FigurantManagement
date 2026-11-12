import { describe, expect, it } from 'vitest'
import { readClientConfig } from './clientConfig.js'

describe('readClientConfig', () => {
  it('defaults to safe mock mode', () => {
    expect(readClientConfig({})).toMatchObject({
      mode: 'mock',
      mutationsEnabled: true,
      groupName: 'monsterland',
      mockDelayMs: 150,
      npcPhotoBaseUrl: '',
      watchtowerBaseUrl: 'https://api.eosfrontier.space/watchtower/',
      session: {
        mode: 'joomla',
        managerGroupIds: ['30', '36', '8', '31'],
        loginUrl: 'https://www.eosfrontier.space/return-to-persona',
      },
    })
  })

  it('uses a mock manager session by default during Vite development', () => {
    expect(readClientConfig({ DEV: true }).session).toMatchObject({
      mode: 'mock',
      mockUser: { id: 'local-manager', groups: ['30'] },
    })
  })

  it('accepts live mode without accepting a browser API token', () => {
    const config = readClientConfig({
      VITE_DATA_SOURCE: 'live',
      VITE_ORTHANC_FIGURANT_GROUP_NAME: 'Crew',
      VITE_NPC_PHOTO_BASE_URL: 'https://characters.example.test/',
      VITE_WATCHTOWER_BASE_URL: 'https://example.test/time-root/',
    })

    expect(config).toMatchObject({
      mode: 'live',
      groupName: 'Crew',
      mutationsEnabled: false,
      npcPhotoBaseUrl: 'https://characters.example.test',
      watchtowerBaseUrl: 'https://example.test/time-root/',
    })
    expect(config).not.toHaveProperty('token')
  })

  it('requires an explicit opt-in for live mutations', () => {
    expect(
      readClientConfig({
        VITE_DATA_SOURCE: 'live',
        VITE_ENABLE_MUTATIONS: 'true',
      }).mutationsEnabled,
    ).toBe(true)
    expect(() =>
      readClientConfig({ VITE_ENABLE_MUTATIONS: 'sometimes' }),
    ).toThrow('VITE_ENABLE_MUTATIONS must be true or false')
  })

  it('rejects an unsupported mode', () => {
    expect(() => readClientConfig({ VITE_DATA_SOURCE: 'production' })).toThrow(
      'VITE_DATA_SOURCE must be either',
    )
  })

  it('rejects malformed mock-session JSON', () => {
    expect(() =>
      readClientConfig({ DEV: true, VITE_JOOMLA_MOCK_USER: '{broken' }),
    ).toThrow('VITE_JOOMLA_MOCK_USER must be valid JSON')
  })

  it('rejects a non-HTTP NPC photo URL', () => {
    expect(() =>
      readClientConfig({ VITE_NPC_PHOTO_BASE_URL: 'javascript:alert(1)' }),
    ).toThrow('VITE_NPC_PHOTO_BASE_URL must be a valid HTTP(S) URL')
  })
})
