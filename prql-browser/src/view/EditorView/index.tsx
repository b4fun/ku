import { Session } from "@b4fun/ku-protos";
import {
  KuLogo,
  SessionNav,
  SessionNavLink,
  SessionNavLinkGroup,
  SessionNavLinkGroupProps,
  SessionNavLinkProps,
  SessionSettingsDrawer,
  useSessionSettingsDrawerAction,
} from "@b4fun/ku-ui";
import { LoadingOverlay, Navbar, Skeleton, Text } from "@mantine/core";
import { Allotment, AllotmentHandle } from "allotment";
import { useEffect, useRef } from "react";
import {
  isSelectedTable,
  useSelectedTable,
  useSelectTable,
  useSessions,
  useUpdateSession,
} from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";
import { EditorPane } from "./EditorPane";
import useStyles from "./useStyles";
import { useViewModelAction, ViewModel } from "./viewModel";

interface EditorNavBarProps {
  viewModel: ViewModel;
}

function EditorNavBar({ viewModel }: EditorNavBarProps) {
  const { cx, classes } = useStyles();
  const [sessions] = useSessions();
  const updateSession = useUpdateSession();
  const [selectedTable, hasSelected] = useSelectedTable();
  const selectTable = useSelectTable();
  const sessionSettingsDrawerAction = useSessionSettingsDrawerAction();

  let sessionNav: React.ReactNode;
  if (viewModel.loading) {
    sessionNav = <Skeleton height={35} />;
  } else {
    const sessionItems: React.ReactElement<SessionNavLinkGroupProps>[] =
      sessions.map((session) => {
        const tableItems: React.ReactElement<SessionNavLinkProps>[] =
          session.tables.map((table) => {
            let isActive = false;
            if (hasSelected && isSelectedTable(selectedTable, table)) {
              isActive = true;
            }

            return (
              <SessionNavLink
                key={table.id}
                active={isActive}
                onClick={() => {
                  selectTable(table);
                }}
              >
                <Text>{table.name}</Text>
              </SessionNavLink>
            );
          });

        return (
          <SessionNavLinkGroup
            name={session.name}
            onActionIconClick={() => {
              sessionSettingsDrawerAction.showDrawer({ session });
            }}
            key={session.id}
          >
            {tableItems}
          </SessionNavLinkGroup>
        );
      });

    sessionNav = <SessionNav>{sessionItems}</SessionNav>;
  }

  return (
    <Navbar height="100%" className={classes.editorNavbar}>
      <SessionSettingsDrawer
        viewModelAction={sessionSettingsDrawerAction}
        onSubmit={async (session: Session) => {
          const resp = await grpcClient().updateSession({ session });
          const updatedSession = resp.response.session;
          if (!updatedSession) {
            return;
          }
          updateSession(updatedSession);
        }}
      />
      <Navbar.Section>
        <div className={classes.editorNavbarLogo}>
          <a href="#">
            <KuLogo />
          </a>
        </div>
      </Navbar.Section>
      <Navbar.Section
        grow
        mt="md"
        className={cx(
          classes.editorNavbarSessionsList,
          "overflow-scroll-noscrollbar"
        )}
      >
        {sessionNav}
      </Navbar.Section>
    </Navbar>
  );
}

// FIXME: responsive
const EditorNavBarMinSizePixel = 300;

export default function EditorView() {
  const { classes } = useStyles();
  const allotmentRef = useRef<AllotmentHandle>(null);
  const viewModelAction = useViewModelAction();
  const { viewModel } = viewModelAction;
  const [selectedTable, hasSelectedTable] = useSelectedTable();

  useEffect(() => {
    viewModelAction.bootstrap();
  }, []);

  return (
    <div className={classes.editorViewWrapper}>
      <Allotment
        ref={allotmentRef}
        onChange={(sizes) => {
          if (sizes.length === 2) {
            viewModelAction.setWidths([sizes[0], sizes[1]]);
          }
        }}
      >
        <Allotment.Pane
          preferredSize={EditorNavBarMinSizePixel + 5}
          maxSize={EditorNavBarMinSizePixel * 2 + 10}
          minSize={0}
        >
          <EditorNavBar viewModel={viewModel} />
        </Allotment.Pane>
        <Allotment.Pane>
          <LoadingOverlay visible={viewModel.loading} overlayOpacity={1} />
          {hasSelectedTable && (
            <EditorPane
              table={selectedTable.table}
              session={selectedTable.session}
              editorWidth={viewModel.widths[1]}
            />
          )}
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
