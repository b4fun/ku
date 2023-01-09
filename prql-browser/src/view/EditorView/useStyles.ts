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
});
