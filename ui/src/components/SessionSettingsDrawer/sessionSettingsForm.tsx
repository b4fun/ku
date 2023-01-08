import { Session } from '@b4fun/ku-protos';
import { Group, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { SubmitButton } from '../form';
import { ViewModelAction } from './viewModel';

interface FormValue {
  name: string;
}

export interface SessionSettingsFormProps {
  session: Session;
  viewModelAction: ViewModelAction;
  onSubmit: (session: Session) => Promise<void>;
}

export function SessionSettingsForm(props: SessionSettingsFormProps) {
  const { session, viewModelAction, onSubmit } = props;
  const { viewModel } = viewModelAction;

  const form = useForm<FormValue>({
    initialValues: {
      name: session.name,
    },

    validate: {
      // TODO: finalize name rules
      name: (value) => (!!value ? null : 'Session name is required'),
    },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();

        const validateResult = form.validate();
        if (validateResult.hasErrors) {
          console.warn('form validation failed', validateResult.errors);
          return;
        }

        session.name = form.values.name;

        viewModelAction.startSubmit();
        try {
          await onSubmit(session);
        } catch (e) {
          console.error('submit failed', e);
          form.setErrors({
            name: `${e}`,
          });
          return;
        } finally {
          viewModelAction.finishSubmit();
        }

        viewModelAction.hideDrawer();
      }}
    >
      <TextInput label="Session ID" disabled className="mb-2" value={session.id} />
      <TextInput label="Session Name" className="mb-2" {...form.getInputProps('name')} />
      <Group mt="md">
        <SubmitButton
          compact
          variant="light"
          type="submit"
          loading={viewModel.submitting}
          disabled={!form.isDirty() || !form.isValid()}
        >
          Update
        </SubmitButton>
      </Group>
    </form>
  );
}
