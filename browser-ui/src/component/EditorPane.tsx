import { Allotment } from "allotment";
import classNames from "classnames";
import React from "react";
import KustoEditor from "./KustoEditor";
import "allotment/dist/style.css";
import { Button } from "@mantine/core";
import { IconPlayerPlay } from '@tabler/icons';

function EditorHeader() {
  const cs = classNames(
    'h-[var(--header-height)]',
    'border-b-[1px] border-[color:var(--border-color-light)]',
    'p-2',
    'text-justify',
  )

  return (
    <div className={cs}>
      <Button
        variant="default"
        size='xs'
        leftIcon={<IconPlayerPlay size={12} />}
      >
        Run
      </Button>
    </div>
  );
}

function EditorBody() {
  const [editorHeight, setEditorHeight] = React.useState(200);

  return (
    <div className="flex-1">
      <Allotment className="w-full" vertical onChange={(sizes) => {
        if (sizes.length === 2) {
          setEditorHeight(sizes[0]);
        }
      }}>
        <KustoEditor height={editorHeight} />
        <div>foobar</div>
      </Allotment>
    </div>
  );
}

export interface EditorPaneProps {
  className?: string;
}

export default function EditorPane(props: EditorPaneProps) {
  const { className } = props;

  const cs = classNames(
    'flex flex-col',
    className,
  )

  return (
    <div className={cs}>
      <EditorHeader />
      <EditorBody />
    </div>
  );
}