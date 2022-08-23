import { TableSchema } from "@b4fun/ku-protos";
import { AppShell, LoadingOverlay, Navbar, Text } from "@mantine/core";
import React, { useEffect, useState } from 'react';

import { useEditorLoaded } from "../../atom/editorAtom";
import { grpcClient } from "../../client/api";
import EditorPane from "../../component/Editor/EditorPane";
import KuLogo from "../../component/KuLogo";
import SessionNav, { SessionNavLinkProps } from "../../component/SessionNav";
import createViewModel, { ViewModel } from "./model";

async function bootstrap(): Promise<ViewModel> {
  const resp = await grpcClient().listSessions({});

  const sessions = resp.response.sessions;

  const rv: ViewModel = {
    sessions,
    isLoading: false,
  };

  if (sessions.length > 0) {
    rv.selectedTable = sessions[0].tables[0];
  }

  return rv;
};

interface EditorNavBarProps {
  viewModel: ViewModel;
  selectTable: (table: TableSchema) => void;
}

function EditorNavBar(props: EditorNavBarProps) {
  const {
    viewModel,
    selectTable,
  } = props;

  const selectedTableName = viewModel.selectedTable?.name || 'source';

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
              selectTable(table);
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

  const isEditorLoading = !useEditorLoaded();

  return (
    <AppShell
      padding={0}
      navbar={<EditorNavBar
        viewModel={viewModel}
        selectTable={(table) => {
          setViewModel({
            ...viewModel,
            selectedTable: table,
          });
        }}
      />}
      className='h-screen relative'
    >
      <LoadingOverlay
        visible={viewModel.isLoading || isEditorLoading}
        overlayOpacity={1}
      />
      {viewModel.selectedTable ?
        (<EditorPane
          table={viewModel.selectedTable}
          className="h-screen"
        />)
        :
        (<></>)
      }
    </AppShell>
  )
}

export default EditorView;