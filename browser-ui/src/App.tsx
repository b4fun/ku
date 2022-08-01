import './App.css'
import { toSQL } from './client'
import KustoEditor from './KustoEditor';

function App() {
  console.log(toSQL('source | where a >= 1 | order by x, y = 1'));

  return (
    <div className="App">
      <KustoEditor />
    </div>
  )
}

export default App
