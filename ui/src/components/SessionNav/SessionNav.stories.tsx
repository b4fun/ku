import { ComponentMeta } from "@storybook/react";
import { SessionNav, SessionNavLink, SessionNavLinkGroup } from "./SessionNav";

export default {
  title: "SessionNav",
  component: SessionNav,
  subcomponents: {
    SessionNavLink,
    SessionNavLinkGroup,
  },
} as ComponentMeta<typeof SessionNav>;

export const Default = () => (
  <SessionNav>
    <SessionNavLinkGroup name="Group 1" onActionIconClick={() => {}}>
      <SessionNavLink active>foobar</SessionNavLink>
      <SessionNavLink>foobar</SessionNavLink>
    </SessionNavLinkGroup>
    <SessionNavLinkGroup name="Group 2" onActionIconClick={() => {}}>
      <SessionNavLink active>foobar</SessionNavLink>
      <SessionNavLink>foobar</SessionNavLink>
    </SessionNavLinkGroup>
  </SessionNav>
);
