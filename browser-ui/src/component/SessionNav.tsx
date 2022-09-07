import { ActionIcon, UnstyledButton } from "@mantine/core";
import { IconTableOptions } from "@tabler/icons";
import classNames from "classnames";
import React, { PropsWithChildren, useState } from "react";

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

  const [hoverTitle, setHoverTitle] = useState(false);

  const actionIconClassNames = classNames({
    'hidden': !hoverTitle,
  })

  return (
    <div className="ml-1 mb-2">
      <div
        className="mb-2 flex align-center items-center align-middle"
        onMouseEnter={e => {
          setHoverTitle(true);
        }}
        onMouseLeave={e => {
          setHoverTitle(false);
        }}
      >
        <span className="flex-1 font-semibold text-sm align-middle h-[28px] leading-[28px]">
          {name}
        </span>
        <ActionIcon color="gray" className={actionIconClassNames}>
          <IconTableOptions size={18} />
        </ActionIcon>
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