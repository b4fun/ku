import { AppShell, LoadingOverlay, Navbar, Text } from "@mantine/core";
import React, { useEffect, useState } from 'react';
import SessionNav, { SessionNavLinkProps } from "../../component/SessionNav";
import EditorPane from "../../component/EditorPane";
import KuLogo from "../../component/KuLogo";
import createViewModel, { ViewModel } from "./model";
import { grpcClient } from "../../client/api";

async function bootstrap(): Promise<ViewModel> {
  const resp = await grpcClient().listSessions({});

  const sessions = resp.response.sessions;

  const rv: ViewModel = {
    sessions,
    isLoading: false,
  };

  if (sessions.length > 0) {
    rv.selectedTableName = sessions[0].tables[0].name;
  }

  return rv;
};

interface EditorNavBarProps {
  viewModel: ViewModel;
  selectTable: (tableName: string) => void;
}

function EditorNavBar(props: EditorNavBarProps) {
  const {
    viewModel,
    selectTable,
  } = props;

  const selectedTableName = viewModel.selectedTableName || 'source';

  let sessionItems: React.ReactElement<SessionNavLinkProps>[] = [];
  if (viewModel.isLoading) {

  } else {
    viewModel.sessions.forEach(session => {
      session.tables.forEach(table => {
        sessionItems.push(
          <SessionNav.Link
            key={table.name}
            active={selectedTableName === table.name}
            onClick={() => {
              selectTable(table.name);
            }}
          >
            <Text>{table.name}</Text>
          </SessionNav.Link>
        );
      })
    });
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
        <SessionNav>
          {sessionItems}
        </SessionNav>
      </Navbar.Section>
    </Navbar>
  );
}

function EditorView() {
  const [viewModel, setViewModel] = useState(createViewModel());
  const [isEditorLoading, setEditorLoading] = useState(true);

  useEffect(() => {
    bootstrap().
      then(setViewModel).
      catch((err) => {
        console.error(`bootstrap failed ${err}`);

        setViewModel({
          sessions: [],
          isLoading: false,
          loadError: err,
        })
      })
  }, []);

  return (
    <AppShell
      padding={0}
      navbar={<EditorNavBar
        viewModel={viewModel}
        selectTable={(tableName) => {
          setViewModel({
            ...viewModel,
            selectedTableName: tableName,
          });
        }}
      />}
      className='h-screen relative'
    >
      <LoadingOverlay
        visible={viewModel.isLoading || isEditorLoading}
        overlayOpacity={1}
      />
      <EditorPane
        tableName={viewModel.selectedTableName || 'source'}
        className="h-screen"
        onLoad={(loaded) => { setEditorLoading(!loaded) }}
      />
    </AppShell>
  )
}

export default EditorView;