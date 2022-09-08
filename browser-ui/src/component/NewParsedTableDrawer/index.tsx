import { Session } from "@b4fun/ku-protos";
import { Button, Drawer, Group, Textarea, TextInput } from "@mantine/core";
import { useForm } from '@mantine/form';
import { useUpdateSession } from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";
import { useViewModelAction, ViewModelAction, ViewModelWithData } from "./viewModel";

interface FormValue {
  tableName: string;
}

function NewParsedTableForm(props: {
  viewModelAction: ViewModelAction<ViewModelWithData>,
}) {
  const { viewModelAction } = props;
  const { viewModel } = viewModelAction;
  const { session, sql, queryInput } = viewModel.data;
  const updateSession = useUpdateSession();

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

        if (session.tables.find(table => table.name === value)) {
          return 'Table name already exists';
        }

        return null;
      },
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

      viewModelAction.startSubmit();
      let updatedSession: Session | undefined;
      try {
        const resp = await grpcClient().createParsedTable({
          sessionId: session.id,
          tableName: form.values.tableName,
          sql,
        });
        updatedSession = resp.response.session
      } catch (e) {
        console.error('create failed', e);
        form.setErrors({
          tableName: `${e}`,
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
        label="Session name"
        className="mb-2"
        disabled
        value={session.name}
      />
      <Textarea
        label="Query"
        className="mb-2"
        disabled
        autosize
        maxRows={15}
        value={queryInput}
      />
      <TextInput
        required
        autoFocus
        data-autofocus
        label="Table name"
        className="mb-2"
        {...form.getInputProps('tableName')}
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
          Create
        </Button>
      </Group>
    </form>
  );
}

export interface NewParsedTableDrawerProps {
  viewModelAction: ViewModelAction;
}

export default function NewParsedTableDrawer(
  props: NewParsedTableDrawerProps,
) {
  const { viewModelAction } = props;
  const { viewModel } = viewModelAction;

  let content = (<></>);
  if (viewModel.data) {
    const formViewModelAction = viewModelAction as ViewModelAction<ViewModelWithData>;
    content = (
      <NewParsedTableForm viewModelAction={formViewModelAction} />
    );
  }

  return (
    <Drawer
      opened={viewModel.show}
      padding="sm"
      title="New parsed table"
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

export const useNewParsedTableDrawerAction = useViewModelAction;