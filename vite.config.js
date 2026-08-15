import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const ORTHANC_PROXY_PREFIX = '/dev-api/orthanc'
const ORTHANC_V2_PATH = '/orthanc/v2/'

function resolveOrthancTarget(rawBaseUrl) {
  if (!rawBaseUrl) return null

  const url = new URL(rawBaseUrl)
  if (url.username || url.password) {
    throw new Error('ORTHANC_BASE_URL must not contain credentials.')
  }

  if (url.pathname === '/') {
    url.pathname = ORTHANC_V2_PATH
  } else if (url.pathname.endsWith('/orthanc/v2')) {
    url.pathname += '/'
  } else if (!url.pathname.endsWith(ORTHANC_V2_PATH)) {
    throw new Error(
      `ORTHANC_BASE_URL must be an origin or end with ${ORTHANC_V2_PATH}`,
    )
  }

  return {
    origin: url.origin,
    apiPath: url.pathname,
  }
}

function createOrthancProxy(env) {
  const token = env.ORTHANC_API_TOKEN?.trim()
  const target = resolveOrthancTarget(env.ORTHANC_BASE_URL?.trim())

  if (!token || !target) return {}

  return {
    [ORTHANC_PROXY_PREFIX]: {
      target: target.origin,
      changeOrigin: true,
      secure: true,
      headers: {
        token,
      },
      rewrite(requestPath) {
        const endpointPath = requestPath.slice(ORTHANC_PROXY_PREFIX.length)
        return `${target.apiPath.replace(/\/$/, '')}/${endpointPath.replace(/^\//, '')}`
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      proxy: createOrthancProxy(env),
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      clearMocks: true,
      css: true,
    },
  }
})
