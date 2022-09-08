import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useForm } from '@mantine/form';
import { useUpdateSession } from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";
import { useViewModelAction, ViewModelAction, ViewModelWithSession } from "./viewModel";

interface SessionSettingsModalFormValue {
  id: string;
  name: string;
}

function SessionSettingsModalForm(props: {
  viewModelAction: ViewModelAction<ViewModelWithSession>,
}) {
  const { viewModelAction } = props;
  const { viewModel } = viewModelAction;
  const updateSession = useUpdateSession();

  const form = useForm<SessionSettingsModalFormValue>({
    initialValues: {
      id: viewModel.session.id,
      name: viewModel.session.name,
    },

    validate: {
      // TODO: finalize name rules
      name: (value) => !!value ? null : 'Session name is required',
    },
  });

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();

      const validateResult = form.validate();
      if (validateResult.hasErrors) {
        console.warn('form validation failed', validateResult.errors);
        return;
      }

      viewModel.session.name = form.values.name;

      viewModelAction.startSubmit();
      try {
        await grpcClient().updateSession({ session: viewModel.session });
      } catch (e) {
        console.error('submit failed', e);
        form.setErrors({
          name: `${e}`,
        });
        return;
      } finally {
        viewModelAction.finishSubmit();
      }

      updateSession(viewModel.session);
      viewModelAction.hideModal();
    }}>
      <TextInput
        label="Session ID"
        disabled
        className="mb-2"
        {...form.getInputProps('id')}
      />
      <TextInput
        label="Session Name"
        className="mb-2"
        {...form.getInputProps('name')}
      />
      <Group mt="md">
        <Button
          compact
          variant="light"
          type="submit"
          loading={viewModel.submitting}
          disabled={!form.isDirty() || !form.isValid()}
          className="bg-[color:var(--theme-color-orange)] hover:bg-[color:var(--theme-color-orange)] text-white"
        >
          Update
        </Button>
      </Group>
    </form>
  );
}

export interface SessionSettingsModalProps {
  viewModelAction: ViewModelAction;
}

export default function SessionSettingsModal(
  props: SessionSettingsModalProps,
) {
  const { viewModelAction } = props;

  const { viewModel } = viewModelAction;

  if (!viewModel.session) {
    return (<></>);
  }

  return (
    <Modal
      title="Session Settings"
      opened={viewModel.show}
      onClose={() => {
        viewModelAction.hideModal();
      }}
    >
      <SessionSettingsModalForm
        viewModelAction={viewModelAction as ViewModelAction<ViewModelWithSession>}
      />
    </Modal>
  );
}

export const useSessionSettingsModalAction = useViewModelAction;