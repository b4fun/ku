import { AppShell, Navbar, Text } from '@mantine/core';
import './App.css'
import SessionNav from './component/SessionNav';
import KustoEditor from './KustoEditor';

function AppNavbar() {
  return (
    <Navbar
      width={{ base: 180, lg: 300 }}
      height='100%'
    >
      <Navbar.Section>
        <div className='h-[var(--header-height)]'>
          {/* TODO: logo */}
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
  return (
    <AppShell
      padding={0}
      navbar={<AppNavbar />}
      className='h-screen'
    >
      foobar
    </AppShell>
  )
}

export default App
