import "@b4fun/ku-ui/style.css";
import "allotment/dist/style.css";
import "./App.css";

import { MantineProvider } from "@mantine/core";
import { Provider } from "jotai";
import EditorView from "./view/EditorView";

function App() {
  return (
    <MantineProvider withNormalizeCSS withGlobalStyles>
      <Provider>
        <EditorView />
      </Provider>
    </MantineProvider>
  );
}

export default App;
