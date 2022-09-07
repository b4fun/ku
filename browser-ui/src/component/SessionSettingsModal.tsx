import { Session } from "@b4fun/ku-protos";
import { Button, Group, Modal, ModalProps, TextInput } from "@mantine/core";

export interface SessionSettingsModalProps extends ModalProps {
  session?: Session;
}

export default function SessionSettingsModal(
  props: SessionSettingsModalProps,
) {
  const { session, ...restProps } = props;

  if (!session) {
    return (<></>);
  }

  return (
    <Modal {...restProps}>
      <form>
        <TextInput
          label="Session ID"
          value={session.id}
          disabled
          className="mb-2"
        />
        <TextInput
          label="Session Name"
          value={session.name}
          className="mb-2"
        />
        <Group mt="md">
          <Button
            compact
            variant="light"
            type="submit"
            className="bg-[color:var(--theme-color-orange)] hover:bg-[color:var(--theme-color-orange)] text-white"
          >
            Submit
          </Button>
        </Group>
      </form>
    </Modal>
  );
}