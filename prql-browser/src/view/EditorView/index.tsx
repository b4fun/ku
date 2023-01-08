import { SessionNav } from "@b4fun/ku-ui";
import { Allotment, AllotmentHandle } from "allotment";
import { useRef } from "react";
import useStyles from "./useStyles";

// FIXME: responsive
const EditorNavBarMinSizePixel = 300;

export default function EditorView() {
  const { classes } = useStyles();
  const allotmentRef = useRef<AllotmentHandle>(null);

  return (
    <div className={classes.editorViewWrapper}>
      <Allotment
        ref={allotmentRef}
        onChange={(sizes) => {
          console.log(sizes);
        }}
      >
        <Allotment.Pane
          preferredSize={EditorNavBarMinSizePixel + 5}
          maxSize={EditorNavBarMinSizePixel * 2 + 10}
          minSize={0}
        >
          <SessionNav></SessionNav>
        </Allotment.Pane>
        <Allotment.Pane>foobar</Allotment.Pane>
      </Allotment>
    </div>
  );
}
