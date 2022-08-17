import { AppShell, LoadingOverlay, Navbar, Text } from "@mantine/core";
import { useEffect, useState } from 'react';
import SessionNav, { SessionNavLinkProps } from "../../component/SessionNav";
import EditorPane from "../../component/EditorPane";
import KuLogo from "../../component/KuLogo";
import createViewModel, { ViewModel } from "./model";
import { grpcClient } from "../../client/api";

async function bootstrap(): Promise<ViewModel> {
  const resp = await grpcClient().listSessions({});

  return {
    sessions: resp.response.sessions,
    isLoading: false,
  };
};

function EditorNavBar(props: { viewModel: ViewModel }) {
  const { viewModel } = props;

  let sessionItems: React.ReactElement<SessionNavLinkProps>[] = [];
  if (viewModel.isLoading) {

  } else {
    sessionItems = viewModel.sessions.map((session, idx) => {
      return (
        <SessionNav.Link
          active={idx === 0}
          onClick={() => { console.log('here') }}
        >
          <Text>{session.id}</Text>
        </SessionNav.Link>
      );
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

  return (
    <AppShell
      padding={0}
      navbar={<EditorNavBar viewModel={viewModel} />}
      className='h-screen relative'
    >
      <LoadingOverlay visible={viewModel.isLoading} />
      <EditorPane />
    </AppShell>
  )
}

export default EditorView;