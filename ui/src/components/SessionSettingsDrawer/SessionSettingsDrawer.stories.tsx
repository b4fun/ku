import { Session } from '@b4fun/ku-protos';
import { Button } from '@mantine/core';
import { ComponentMeta } from '@storybook/react';
import { useState } from 'react';
import { SessionSettingsDrawer } from '.';
import { useViewModelAction } from './viewModel';

export default {
  title: 'SessionSettingsDrawer',
  component: SessionSettingsDrawer,
} as ComponentMeta<typeof SessionSettingsDrawer>;

export const Default = () => {
  const [session, setSession] = useState<Session>({
    id: 'session-id',
    tables: [],
    name: 'session-name',
  });

  const viewModelAction = useViewModelAction({ session });

  return (
    <>
      <Button
        onClick={() => {
          viewModelAction.showDrawer({ session });
        }}
      >
        Show Drawer
      </Button>
      <SessionSettingsDrawer
        viewModelAction={viewModelAction}
        onSubmit={async (session) => {
          console.log('submit', session);
          setSession(session);
        }}
      />
    </>
  );
};
