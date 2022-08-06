import { UnstyledButton } from "@mantine/core";
import classNames from "classnames";
import React, { PropsWithChildren } from "react";

export interface SessionNavLinkProps {
  active?: boolean;
  onClick?: () => void;
}

export function SessionNavLink(
  props: PropsWithChildren<SessionNavLinkProps>,
) {
  const {
    active,
    onClick,
    children,
  } = props;

  const cs = classNames(
    'w-full block py-1 px-2 mb-2 border border-solid rounded transition-colors',
    {
      'border-slate-100 hover:border-slate-500': !active,
      'border-slate-500': active,
    }
  );

  return (
    <UnstyledButton
      component="a"
      onClick={onClick}
      className={cs}
    >
      {children}
    </UnstyledButton>
  );
}

export interface SessionNavProps {
  children: Iterable<React.ReactElement<SessionNavLinkProps>>;
}

export default function SessionNav(props: SessionNavProps) {
  const { children } = props;

  return (
    <div className="m-1">
      {children}
    </div>
  );
}

SessionNav.Link = SessionNavLink;