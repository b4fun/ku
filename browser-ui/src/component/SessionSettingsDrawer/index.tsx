import { Session } from "@b4fun/ku-protos";
import { Button, Drawer, Group, TextInput } from "@mantine/core";
import { useForm } from '@mantine/form';
import { useUpdateSession } from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";
import { useViewModelAction, ViewModelAction, ViewModelWithData } from "./viewModel";

interface FormValue {
  name: string;
}

function SessionSettingsForm(props: {
  viewModelAction: ViewModelAction<ViewModelWithData>,
}) {
  const { viewModelAction } = props;
  const { viewModel } = viewModelAction;
  const { data: { session } } = viewModel;
  const updateSession = useUpdateSession();

  const form = useForm<FormValue>({
    initialValues: {
      name: session.name,
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

      session.name = form.values.name;

      viewModelAction.startSubmit();
      let updatedSession: Session | undefined;
      try {
        const resp = await grpcClient().updateSession({ session });
        updatedSession = resp.response.session;
      } catch (e) {
        console.error('submit failed', e);
        form.setErrors({
          name: `${e}`,
        });
        return;
      } finally {
        viewModelAction.finishSubmit();
      }

      if (updatedSession) {
        updateSession(updatedSession);
      }
      viewModelAction.hideDrawer();
    }}>
      <TextInput
        label="Session ID"
        disabled
        className="mb-2"
        value={session.id}
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

export interface SessionSettingsDrawerProps {
  viewModelAction: ViewModelAction;
}

export default function SessionSettingsDrawer(
  props: SessionSettingsDrawerProps,
) {
  const { viewModelAction } = props;
  const { viewModel } = viewModelAction;

  let content = (<></>);

  if (viewModel.data) {
    const formViewModelAction = viewModelAction as ViewModelAction<ViewModelWithData>;
    content = (
      <SessionSettingsForm viewModelAction={formViewModelAction} />
    );
  }

  return (
    <Drawer
      opened={viewModel.show}
      padding="sm"
      title="Session Settings"
      position="left"
      overlayColor="#909296"
      overlayOpacity={0.1}
      overlayBlur={1}
      onClose={() => {
        viewModelAction.hideDrawer();
      }}
    >
      {content}
    </Drawer>
  );
}

export const useSessionSettingsDrawerAction = useViewModelAction;