import "allotment/dist/style.css";
import { Provider } from 'jotai';
import './App.css';
import EditorView from './view/EditorView';


function App() {
  return (
    <Provider>
      <EditorView />
    </Provider>
  )
}

export default App
