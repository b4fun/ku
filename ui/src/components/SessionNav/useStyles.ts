import { createStyles } from "@mantine/core";
import { remSpacing, themeColors } from "../../settings";

export default createStyles((theme) => {
  return {
    sessionNav: {
      padding: remSpacing.s1,
      marginRight: remSpacing.s2,
      maxWidth: "300px",
    },

    sessionNavLink: {
      width: "100%",
      display: "block",
      paddingLeft: remSpacing.s2,
      paddingRight: remSpacing.s2,
      paddingTop: remSpacing.s1,
      paddingBottom: remSpacing.s1,
      marginBottom: remSpacing.s2,
      borderWidth: "1px",
      borderStyle: "solid",
      borderRadius: remSpacing.s1,
      transitionProperty:
        "color, background-color, border-color, text-decoration-color, fill, stroke",
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      transitionDuration: "150ms",
    },
    sessionNavLinkActive: {
      borderColor: themeColors.orangeLight,
      backgroundColor: themeColors.orange,
      color: theme.white,
    },
    sessionNavLinkInactive: {
      borderColor: "#f1f5f9",
      "&:hover": {
        borderColor: themeColors.orange,
      },
    },

    sessionNavLinkGroupWrapper: {
      marginLeft: remSpacing.s1,
      marginBottom: remSpacing.s2,
    },
    sessionNavLinkGroupChildrenWrapper: {
      marginLeft: remSpacing.s2,
    },
    sessionNavLinkGroupTitleWrapper: {
      marginBottom: remSpacing.s2,
      display: "flex",
      verticalAlign: "middle",
      alignItems: "center",
    },
    sessionNavLinkGroupTitle: {
      flex: "1",
      fontWeight: 600,
      fontSize: remSpacing.sm,
      lineHeight: "28px",
      height: "28px",
    },
    sessionNavLinkGroupTitleIconHidden: {
      display: "none",
    },
  };
});
