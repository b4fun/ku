import { Session } from '@b4fun/ku-protos';
import { Group, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { SubmitButton } from '../form';
import { ViewModelAction } from './viewModel';

interface FormValue {
  tableName: string;
}

export interface NewParsedTableFormProps {
  session: Session;
  queryInput: string;
  viewModelAction: ViewModelAction;
  onSubmit: (tableName: string) => Promise<void>;
}

export function NewParsedTableForm(props: NewParsedTableFormProps) {
  const { viewModelAction, session, queryInput, onSubmit } = props;
  const { viewModel } = viewModelAction;

  const form = useForm<FormValue>({
    initialValues: {
      tableName: '',
    },

    validate: {
      // TODO: finalize name rules
      tableName: (value) => {
        if (!value) {
          return 'Table name is required';
        }

        if (session.tables.find((table) => table.name === value)) {
          return 'Table name already exists';
        }

        return null;
      },
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

        viewModelAction.startSubmit();
        try {
          onSubmit(form.values.tableName);
        } catch (e) {
          console.error('create failed', e);
          form.setErrors({
            tableName: `${e}`,
          });
          return;
        } finally {
          viewModelAction.finishSubmit();
        }

        viewModelAction.hideDrawer();
      }}
    >
      <TextInput label="Session name" className="mb-2" disabled value={session.name} />
      <Textarea label="Query" className="mb-2" disabled autosize maxRows={15} value={queryInput} />
      <TextInput
        required
        autoFocus
        data-autofocus
        label="Table name"
        className="mb-2"
        {...form.getInputProps('tableName')}
      />
      <Group mt="md">
        <SubmitButton
          compact
          variant="light"
          type="submit"
          loading={viewModel.submitting}
          disabled={!form.isDirty() || !form.isValid()}
        >
          Create
        </SubmitButton>
      </Group>
    </form>
  );
}
