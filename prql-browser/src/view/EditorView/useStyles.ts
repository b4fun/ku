import { remSpacing } from "@b4fun/ku-ui";
import { createStyles } from "@mantine/core";

export default createStyles({
  editorViewWrapper: {
    height: "100vh",
    width: "100%",
    position: "relative",
  },

  editorNavbar: {
    borderRightWidth: 0,
  },
  editorNavbarLogo: {
    height: "var(--header-height)",
  },
  editorNavbarSessionsList: {
    height: "100%",
    overflow: "scroll",
  },

  editorPaneWrapper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  editorPaneHeader: {
    height: "var(--header-height)",
    borderBottom: "1px solid var(--border-color-light)",
    textAlign: "justify",
    padding: remSpacing.s2,
  },
  editorPaneHeaderButton: {
    marginRight: remSpacing.s2,
  },
  editorPaneBodyWrapper: {
    flex: "1 1 0%", // flex-1
  },
  editorPaneBodyAllotment: {
    width: "100%",
    display: "flex",
  },
});
