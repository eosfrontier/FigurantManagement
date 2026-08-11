import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { createApplicationDataSource } from './data/createDataSource.js'
import { readClientConfig } from './data/clientConfig.js'
import './styles.css'

const config = readClientConfig(import.meta.env)
const dataSource = createApplicationDataSource(config)

createRoot(document.getElementById('root')).render(
  <App dataSource={dataSource} mode={config.mode} />,
)
