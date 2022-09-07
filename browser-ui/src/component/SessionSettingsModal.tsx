import { Session } from "@b4fun/ku-protos";
import { Button, Group, Modal, ModalProps, TextInput } from "@mantine/core";
import { useForm } from '@mantine/form';
import { useState } from "react";

export interface SessionSettingsModalFormValue {
  id: string;
  name: string;
}

export interface SessionSettingsModalProps extends ModalProps {
  session?: Session;
  onSubmitForm: (value: SessionSettingsModalFormValue) => PromiseLike<any>;
}

function SessionSettingsModalForm(props: {
  session: Session;
  onSubmitForm: SessionSettingsModalProps['onSubmitForm'];
}) {
  const { session, onSubmitForm } = props;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SessionSettingsModalFormValue>({
    initialValues: {
      id: session.id,
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

      form.validate();

      setSubmitting(true);
      try {
        await onSubmitForm(form.values);
      } finally {
        setSubmitting(false);
      }
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
          loading={submitting}
          className="bg-[color:var(--theme-color-orange)] hover:bg-[color:var(--theme-color-orange)] text-white"
        >
          Submit
        </Button>
      </Group>
    </form>
  );
}

export default function SessionSettingsModal(
  props: SessionSettingsModalProps,
) {
  const { session, onSubmitForm, ...restProps } = props;

  if (!session) {
    return (<></>);
  }

  return (
    <Modal {...restProps}>
      <SessionSettingsModalForm
        session={session}
        onSubmitForm={onSubmitForm}
      />
    </Modal>
  );
}