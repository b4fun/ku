import useStyles from "./useStyles";
import { ActionIcon, UnstyledButton } from "@mantine/core";
import { IconTableOptions } from "@tabler/icons";
import { useState } from "react";
import classNames from "classnames";

export interface SessionNavLinkProps {
  active?: boolean;
  onClick?: () => void;
}

export function SessionNavLink(
  props: React.PropsWithChildren<SessionNavLinkProps>
) {
  const { active, onClick, children } = props;
  const { classes } = useStyles();

  const cs = classNames(classes.sessionNavLink, {
    [classes.sessionNavLinkActive]: active,
    [classes.sessionNavLinkInactive]: !active,
  });

  return (
    <UnstyledButton component="a" onClick={onClick} className={cs}>
      {children}
    </UnstyledButton>
  );
}

export interface SessionNavLinkGroupProps {
  name: string;
  onActionIconClick: () => void;
}

export function SessionNavLinkGroup(
  props: React.PropsWithChildren<SessionNavLinkGroupProps>
) {
  const { classes } = useStyles();
  const { name, onActionIconClick, children } = props;

  const [hoverTitle, setHoverTitle] = useState(false);

  const actionIconClassNames = classNames({
    [classes.sessionNavLinkGroupTitleIconHidden]: !hoverTitle,
  });

  return (
    <div className={classes.sessionNavLinkGroupWrapper}>
      <div
        className={classes.sessionNavLinkGroupTitleWrapper}
        onMouseEnter={(e) => {
          setHoverTitle(true);
        }}
        onMouseLeave={(e) => {
          setHoverTitle(false);
        }}
      >
        <span className={classes.sessionNavLinkGroupTitle}>{name}</span>
        <ActionIcon
          color="gray"
          className={actionIconClassNames}
          onClick={onActionIconClick}
        >
          <IconTableOptions size={18} />
        </ActionIcon>
      </div>
      <div className={classes.sessionNavLinkGroupChildrenWrapper}>
        {children}
      </div>
    </div>
  );
}

export function SessionNav(props: React.PropsWithChildren) {
  const { children } = props;
  const { classes } = useStyles();

  return <div className={classes.sessionNav}>{children}</div>;
}
