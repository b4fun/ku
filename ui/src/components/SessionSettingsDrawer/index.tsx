import { Drawer } from '@mantine/core';
import { SessionSettingsForm, SessionSettingsFormProps } from './sessionSettingsForm';
import { ViewModelAction } from './viewModel';
export { useViewModelAction as useSessionSettingsDrawerAction } from './viewModel';

export interface SessionSettingsDrawerProps {
  viewModelAction: ViewModelAction;
  onSubmit: SessionSettingsFormProps['onSubmit'];
}

export function SessionSettingsDrawer(props: SessionSettingsDrawerProps) {
  const { viewModelAction, onSubmit } = props;
  const { viewModel } = viewModelAction;

  return (
    <Drawer
      opened={viewModel.show}
      padding="sm"
      title="Session Settings"
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
        <SessionSettingsForm
          session={viewModel.data.session}
          onSubmit={onSubmit}
          viewModelAction={viewModelAction}
        />
      ) : (
        <></>
      )}
    </Drawer>
  );
}
