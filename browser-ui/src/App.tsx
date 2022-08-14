import { AppShell, Navbar, Text } from '@mantine/core';
import './App.css'
import SessionNav from './component/SessionNav';
import EditorPane from './component/EditorPane';
import KuLogo from './component/KuLogo';
import { grpcClient } from './client/api';
import { useEffect, useState } from 'react';

async function bootstrap() {
  const resp = await grpcClient.listSessions({});
  console.log(resp);
}

function AppNavbar() {
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
          <SessionNav.Link
            active
            onClick={() => { console.log('here') }}
          >
            <Text>ku-abcd</Text>
          </SessionNav.Link>
          <SessionNav.Link
            onClick={() => { console.log('here') }}
          >
            <Text>ku-abcd</Text>
          </SessionNav.Link>
        </SessionNav>
      </Navbar.Section>
    </Navbar>
  );
}

function App() {
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    bootstrap().
      then(() => {
        setLoading(false);
      }).
      catch((err) => {
        console.error(`bootstrap failed ${err}`);
      })
  }, []);

  return (
    <AppShell
      padding={0}
      navbar={<AppNavbar />}
      className='h-screen'
    >
      <EditorPane className='h-screen' />
    </AppShell>
  )
}

export default App
