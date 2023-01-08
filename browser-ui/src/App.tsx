import "@b4fun/ku-ui/style.css";
import "allotment/dist/style.css";
import "./App.css";

import { Provider } from "jotai";
import EditorView from "./view/EditorView";

function App() {
  return (
    <Provider>
      <EditorView />
    </Provider>
  );
}

export default App;
