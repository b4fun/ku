import { Session } from "@b4fun/ku-protos";
import { LoadingOverlay, Navbar, Skeleton, Text } from "@mantine/core";
import { Allotment, AllotmentHandle } from "allotment";
import React, { useEffect, useRef } from 'react';

import { useEditorLoaded } from "../../atom/editorAtom";
import { isSelectedTable, useSelectedTable, useSelectTable, useSessions } from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";
import EditorPane from "../../component/Editor/EditorPane";
import KuLogo from "../../component/KuLogo";
import SessionNav, { SessionNavLinkGroupProps, SessionNavLinkProps } from "../../component/SessionNav";
import SessionSettingsDrawer, { useSessionSettingsDrawerAction } from "../../component/SessionSettingsDrawer";
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
  const sessionSettingsDrawerAction = useSessionSettingsDrawerAction();

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
            sessionSettingsDrawerAction.showDrawer({ session });
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
      height='100%'
    >
      <SessionSettingsDrawer viewModelAction={sessionSettingsDrawerAction} />
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
  const { viewModel } = viewModelAction;
  const allotmentRef = useRef<AllotmentHandle>(null);

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
    <div className="h-screen relative w-full">
      <Allotment
        ref={allotmentRef}
        onChange={(sizes) => {
          if (sizes.length === 2) {
            viewModelAction.setWidths([sizes[0], sizes[1]]);
          }
        }}
      >
        <Allotment.Pane preferredSize={300} minSize={0} maxSize={300}>
          <EditorNavBar viewModel={viewModel} />
        </Allotment.Pane>
        <Allotment.Pane>
          <LoadingOverlay
            visible={viewModel.loading || isEditorLoading}
            overlayOpacity={1}
          />
          {tableSelected ?
            (<EditorPane
              editorNavVisible={viewModel.widths[0] > 30}
              editorWidth={viewModel.widths[1]}
              showEditorNav={() => {
                allotmentRef.current?.reset();
              }}

              table={selectedTable.table}
              session={selectedTable.session}
              className="h-screen"
            />)
            :
            (<></>)
          }
        </Allotment.Pane>
      </Allotment>
    </div >
  )
}

export default EditorView;