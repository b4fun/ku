import { Session } from "@b4fun/ku-protos";
import { AppShell, LoadingOverlay, Navbar, Skeleton, Text } from "@mantine/core";
import React, { useEffect } from 'react';

import { useEditorLoaded } from "../../atom/editorAtom";
import { isSelectedTable, useSelectedTable, useSelectTable, useSessions } from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";
import EditorPane from "../../component/Editor/EditorPane";
import KuLogo from "../../component/KuLogo";
import SessionNav, { SessionNavLinkGroupProps, SessionNavLinkProps } from "../../component/SessionNav";
import SessionSettingsModal, { useSessionSettingsModalAction } from "../SessionSettingsModal";
import { useViewModelAction, ViewModel } from "./viewModel";

async function bootstrap(): Promise<Session[]> {
  const resp = await grpcClient().listSessions({});

  return resp.response.sessions;
};

interface EditorNavBarProps {
  viewModel: ViewModel;
}

function EditorNavBar(props: EditorNavBarProps) {
  const {
    viewModel,
  } = props;

  const [sessions] = useSessions();
  const [selectedTable, hasSelected] = useSelectedTable();
  const selectTable = useSelectTable();
  const sessionSettingModalAction = useSessionSettingsModalAction();

  let sessionNav: React.ReactNode;
  if (viewModel.loading) {
    sessionNav = (<Skeleton height={35} />);
  } else {
    const sessionItems: React.ReactElement<SessionNavLinkGroupProps>[] = sessions.map(session => {
      const tableItems: React.ReactElement<SessionNavLinkProps>[] = session.tables.map(table => {
        let isActive = false;
        if (hasSelected && isSelectedTable(selectedTable, table)) {
          isActive = true;
        }

        return (
          <SessionNav.Link
            key={table.id}
            active={isActive}
            onClick={() => {
              selectTable(table);
            }}
          >
            <Text>{table.name}</Text>
          </SessionNav.Link>
        );
      });

      return (
        <SessionNav.LinkGroup
          name={session.name}
          onActionIconClick={() => {
            sessionSettingModalAction.showModal(session);
          }}
          key={session.id}
        >
          {tableItems}
        </SessionNav.LinkGroup>
      );
    });

    sessionNav = (
      <SessionNav>
        {sessionItems}
      </SessionNav>
    );
  }

  return (
    <Navbar
      width={{ base: 180, lg: 360 }}
      height='100%'
    >
      <SessionSettingsModal viewModelAction={sessionSettingModalAction} />
      <Navbar.Section>
        <div className='h-[var(--header-height)]'>
          <a href="#">
            <KuLogo />
          </a>
        </div>
      </Navbar.Section>
      <Navbar.Section grow mt='md' className="h-full overflow-scroll">
        {sessionNav}
      </Navbar.Section>
    </Navbar>
  );
}

function EditorView() {
  const [, setSessions] = useSessions();
  const viewModelAction = useViewModelAction();

  useEffect(() => {
    viewModelAction.setLoading(true);

    bootstrap().
      then((sessions: Session[]) => {
        setSessions(sessions);
        viewModelAction.setLoading(false);
      }).
      catch((err) => {
        console.error(`bootstrap failed ${err}`);
        viewModelAction.setLoadErr(err);
      });
  }, []);

  const isEditorLoading = !useEditorLoaded();
  const [selectedTable, tableSelected] = useSelectedTable();

  return (
    <AppShell
      padding={0}
      navbar={<EditorNavBar
        viewModel={viewModelAction.viewModel}
      />}
      className='h-screen relative'
    >
      <LoadingOverlay
        visible={viewModelAction.viewModel.loading || isEditorLoading}
        overlayOpacity={1}
      />
      {tableSelected ?
        (<EditorPane
          table={selectedTable.table}
          className="h-screen"
        />)
        :
        (<></>)
      }
    </AppShell>
  )
}

export default EditorView;