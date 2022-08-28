import { Session } from "@b4fun/ku-protos";
import { AppShell, LoadingOverlay, Navbar, Skeleton, Text } from "@mantine/core";
import React, { useEffect } from 'react';

import { useEditorLoaded } from "../../atom/editorAtom";
import { isSelectedTable, useSelectedTable, useSelectTable } from "../../atom/tableAtom";
import { grpcClient } from "../../client/api";
import EditorPane from "../../component/Editor/EditorPane";
import KuLogo from "../../component/KuLogo";
import SessionNav, { SessionNavLinkProps } from "../../component/SessionNav";
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

  const [selectedTable, hasSelected] = useSelectedTable();
  const selectTable = useSelectTable();

  let sessionNav: React.ReactNode;
  if (viewModel.loading) {
    sessionNav = (<Skeleton height={35} />);
  } else {
    const sessionItems: React.ReactElement<SessionNavLinkProps>[] = [];

    viewModel.sessions.forEach(session => {
      session.tables.forEach(table => {
        let isActive = false;
        if (hasSelected && isSelectedTable(selectedTable, table)) {
          isActive = true;
        }

        sessionItems.push(
          <SessionNav.Link
            key={table.name}
            active={isActive}
            onClick={() => {
              selectTable(session, table);
            }}
          >
            <Text>{table.name}</Text>
          </SessionNav.Link>
        );
      })
    });

    sessionNav = (
      <SessionNav>
        {sessionItems}
      </SessionNav>
    );
  }

  return (
    <Navbar
      width={{ base: 180, lg: 300 }}
      height='100%'
    >
      <Navbar.Section>
        <div className='h-[var(--header-height)]'>
          <a href="#">
            <KuLogo />
          </a>
        </div>
      </Navbar.Section>
      <Navbar.Section grow mt='md'>
        {sessionNav}
      </Navbar.Section>
    </Navbar>
  );
}

function EditorView() {
  const viewModelAction = useViewModelAction();
  const selectTable = useSelectTable();

  useEffect(() => {
    viewModelAction.setLoading(true);

    bootstrap().
      then((sessions: Session[]) => {
        viewModelAction.setSessions(sessions);

        const firstAvailableSession = sessions.find(session => {
          return session.tables.length > 0;
        });
        if (firstAvailableSession) {
          selectTable(firstAvailableSession, firstAvailableSession.tables[0]);
        }
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