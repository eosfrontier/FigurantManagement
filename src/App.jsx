import ApiWorkbench from './features/api-workbench/ApiWorkbench.jsx'

export default function App({ dataSource, mode }) {
  return <ApiWorkbench dataSource={dataSource} mode={mode} />
}
