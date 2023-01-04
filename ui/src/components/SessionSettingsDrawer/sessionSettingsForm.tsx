import { Session } from '@b4fun/ku-protos';
import { Button, createStyles, Group, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { themeColors } from '../../settings';
import { ViewModelAction } from './viewModel';

const useStyles = createStyles((theme) => {
  return {
    submitButton: {
      // hack: https://github.com/tailwindlabs/tailwindcss/issues/6602
      backgroundColor: `${themeColors.orange} !important`,
      color: theme.white,
      '&:hover': {
        backgroundColor: `${themeColors.orangeLight} !important`,
      },
    },
  };
});

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

  const formDisabled = !form.isDirty() || !form.isValid();
  const { classes, cx } = useStyles();

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
        <Button
          compact
          variant="light"
          type="submit"
          loading={viewModel.submitting}
          disabled={formDisabled}
          className={cx({ [classes.submitButton]: !formDisabled })}
        >
          Update
        </Button>
      </Group>
    </form>
  );
}
