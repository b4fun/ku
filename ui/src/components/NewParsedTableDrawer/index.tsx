import { Drawer } from '@mantine/core';
import { NewParsedTableForm, NewParsedTableFormProps } from './newParsedTableForm';
import { ViewModelAction } from './viewModel';
export { useViewModelAction as useNewParsedTableDrawerAction } from './viewModel';

export interface NewParsedTableDrawerProps {
  viewModelAction: ViewModelAction;
  onSubmit: NewParsedTableFormProps['onSubmit'];
}

export function NewParsedTableDrawer(props: NewParsedTableDrawerProps) {
  const { viewModelAction, onSubmit } = props;
  const { viewModel } = viewModelAction;

  return (
    <Drawer
      opened={viewModel.show}
      padding="sm"
      title="New parsed table"
      position="left"
      overlayProps={{
        color: '#909296',
        opacity: 0.1,
        blur: 1,
      }}
      onClose={() => {
        viewModelAction.hideDrawer();
      }}
    >
      {viewModel.data ? (
        <NewParsedTableForm
          session={viewModel.data.session}
          queryInput={viewModel.data.queryInput}
          onSubmit={onSubmit}
          viewModelAction={viewModelAction}
        />
      ) : (
        <></>
      )}
    </Drawer>
  );
}
