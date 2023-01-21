import "@b4fun/ku-ui/style.css";
import "allotment/dist/style.css";
import "./App.css";

import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { Provider } from "jotai";
import EditorView from "./view/EditorView";

function App() {
  return (
    <MantineProvider withNormalizeCSS withGlobalStyles>
      <NotificationsProvider>
        <Provider>
          <EditorView />
        </Provider>
      </NotificationsProvider>
    </MantineProvider>
  );
}

export default App;
