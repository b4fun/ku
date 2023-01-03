import { Session } from "@b4fun/ku-protos";
import { Card, Code, Group, LoadingOverlay, Navbar, Skeleton, Text } from "@mantine/core";
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

// FIXME: responsive
const EditorNavBarMinSizePixel = 300;

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
      className='border-r-[0px]'
    >
      <SessionSettingsDrawer viewModelAction={sessionSettingsDrawerAction} />
      <Navbar.Section>
        <div className='h-[var(--header-height)]'>
          <a href="#">
            <KuLogo />
          </a>
        </div>
      </Navbar.Section>
      <Navbar.Section grow mt='md' className="h-full overflow-scroll overflow-scroll-noscrollbar">
        {sessionNav}
      </Navbar.Section>
    </Navbar>
  );
}

const supportedKeywords = [
  'project', 'where', 'take', 'order by', 'parse', 'count', 'distinct',
  'and', 'or', '>/>=/</<=/==/!=', 'contains', '!contains',
];

const supportedDataTypes = [
  'boolean', 'string', 'integer/long', 'real/float/double',
];

const partialSupportedDataTypes = [
  'datetime', 'timespan', 'dynamic',
];

function EditorManual() {
  const supportedKeywordsList = supportedKeywords.map((keyword, idx) => {
    return (
      <Code color="blue" key={`${idx}`}>
        {keyword}
      </Code>
    );
  });

  const supportedDataTypesList = supportedDataTypes.map((dataType, idx) => {
    return (
      <Code color="blue" key={`${idx}`}>
        {dataType}
      </Code>
    );
  });

  const partialSupportedDataTypesList = partialSupportedDataTypes.map((dataType, idx) => {
    return (
      <Code color="yellow" key={`${idx}`}>
        {dataType}
      </Code>
    );
  });

  return (
    <Card
      shadow="xs" radius="md" p={0}
      className="w-[300px] h-full text-sm leading-6 pb-20"
    >
      <Card.Section className="bg-[color:var(--theme-color-orange)] text-white py-2 px-4 mb-2">
        <h3 className="font-semibold text-base">
          Manual
        </h3>
      </Card.Section>

      <div className="h-full overflow-scroll overflow-scroll-noscrollbar pt-2 px-4">
        <Card.Section className="mb-1">
          <p className="font-semibold">What's KQL?</p>
        </Card.Section>
        <Card.Section className="mb-2">
          <p>KQL (Kusto Query Language) is a way to explore data with SQL like language.</p>
          <p>Different than typical SQL, KQL uses ML like syntax, which provides better reading / writing experience.</p>
          <a href="https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/" target="_blank" rel="noreferrer" className="underline">
            Learn more about on Microsoft Docs
          </a>
        </Card.Section>

        <Card.Section className="mb-1">
          <p className="font-semibold">
            What's Ku?
          </p>
        </Card.Section>
        <Card.Section className="mb-3">
          <p>Ku is a simple tool for collecting and exploring logs using KQL and sqlite.</p>
          <p>This page is the query UI for Ku, where we can write and execute KQL upon on our data.</p>
          <a href="https://github.com/b4fun/ku" target="_blank" className="underline">
            Checkout on GitHub
          </a>
        </Card.Section>

        <Card.Section className="mb-1">
          <p className="font-semibold">Supported KQL Keywords</p>
        </Card.Section>
        <Card.Section className="mb-2">
          <Group spacing="xs">
            {supportedKeywordsList}
          </Group>
        </Card.Section>

        <Card.Section className="mb-1">
          <p className="font-semibold">Supported KQL Data Types</p>
        </Card.Section>
        <Card.Section className="mb-2">
          <Group spacing="xs">
            {supportedDataTypesList}
          </Group>
        </Card.Section>

        <Card.Section className="mb-1">
          <p className="font-semibold">Partial Supported KQL Data Types</p>
        </Card.Section>
        <Card.Section inheritPadding className="mb-2">
          <Group spacing="xs">
            {partialSupportedDataTypesList}
          </Group>
        </Card.Section>
      </div>
    </Card>
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
        <Allotment.Pane preferredSize={EditorNavBarMinSizePixel + 5} maxSize={EditorNavBarMinSizePixel * 2 + 10} minSize={0}>
          <div className='flex h-full'>
            <div className='flex-none'>
              <EditorNavBar viewModel={viewModel} />
            </div>
            <div className="grow h-full py-2 pr-2 editor-manual-rotation">
              <EditorManual />
            </div>
          </div>
        </Allotment.Pane>
        <Allotment.Pane>
          <LoadingOverlay
            visible={viewModel.loading || isEditorLoading}
            overlayOpacity={1}
          />
          {tableSelected ?
            (<EditorPane
              editorNavVisible={viewModel.widths[0] > EditorNavBarMinSizePixel - 5}
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