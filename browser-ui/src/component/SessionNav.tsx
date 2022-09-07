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
      'border-slate-100 hover:border-[color:var(--theme-color-orange)]': !active,
      'border-[color:var(--theme-color-orange-light)] bg-[color:var(--theme-color-orange)] text-white': active,
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

export interface SessionNavLinkGroupProps {
  name: string;
  children: Iterable<React.ReactElement<SessionNavLinkProps>>;
}

export function SessionNavLinkGroup(props: SessionNavLinkGroupProps) {
  const { name, children } = props;

  return (
    <div className="mb-2">
      <div className="mb-2 font-semibold text-sm">
        {name}
      </div>
      <div className="ml-2">
        {children}
      </div>
    </div>
  );
}

export interface SessionNavProps {
  children: Iterable<React.ReactElement<SessionNavLinkGroupProps>>;
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
SessionNav.LinkGroup = SessionNavLinkGroup