import { Session } from '@b4fun/ku-protos';
import { Button } from '@mantine/core';
import { ComponentMeta } from '@storybook/react';
import { NewParsedTableDrawer } from '.';
import { useViewModelAction } from './viewModel';

export default {
  title: 'NewParsedTableDrawer',
  component: NewParsedTableDrawer,
} as ComponentMeta<typeof NewParsedTableDrawer>;

export const Default = () => {
  const session: Session = {
    id: 'session-id',
    tables: [],
    name: 'session-name',
  };
  const queryInput = `select 1 as a`;

  const viewModelAction = useViewModelAction({ session, queryInput });

  return (
    <>
      <Button
        onClick={() => {
          viewModelAction.showDrawer({ session, queryInput });
        }}
      >
        Show Drawer
      </Button>
      <NewParsedTableDrawer
        viewModelAction={viewModelAction}
        onSubmit={async (tableName) => {
          console.log('submit', tableName);
        }}
      />
    </>
  );
};
