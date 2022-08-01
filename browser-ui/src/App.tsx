import './App.css'
import { toSQL } from './client'

function App() {
  console.log(toSQL('source | where a >= 1 | order by x, y = 1'));

  return (
    <div className="App">
      hello, world
    </div>
  )
}

export default App
