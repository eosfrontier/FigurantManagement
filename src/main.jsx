import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { JoomlaSessionProvider } from './auth/JoomlaSessionContext.jsx'
import { createApplicationDataSource } from './data/createDataSource.js'
import { readClientConfig } from './data/clientConfig.js'

const config = readClientConfig(import.meta.env)
const dataSource = createApplicationDataSource(config)

createRoot(document.getElementById('root')).render(
  <JoomlaSessionProvider
    loadSession={dataSource.getSession}
    authMode={config.session.mode}
  >
    <App dataSource={dataSource} config={config} />
  </JoomlaSessionProvider>,
)
