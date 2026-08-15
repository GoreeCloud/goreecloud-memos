import { useEditorContext, useEditorSelector } from "../state";
import { composeNoteContent, splitNoteTitle } from "../utils/noteTitle";

interface NoteTitleFieldProps {
  onEnter?: () => void;
}

/**
 * Optional GoreeCloud Notes title field backed by the memo's leading Markdown
 * H1. The stored document remains ordinary Markdown and stays compatible with
 * upstream Memos.
 */
export const NoteTitleField = ({ onEnter }: NoteTitleFieldProps) => {
  const { actions, dispatch } = useEditorContext();
  const content = useEditorSelector((state) => state.content);
  const { title, body } = splitNoteTitle(content);

  return (
    <input
      type="text"
      value={title}
      placeholder="Title"
      aria-label="Note title"
      className="w-full border-0 bg-transparent px-0 py-0.5 text-lg font-medium leading-6 text-foreground outline-none placeholder:text-muted-foreground/75 focus:ring-0"
      onChange={(event) => dispatch(actions.updateContent(composeNoteContent(event.target.value, body)))}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        onEnter?.();
      }}
    />
  );
};
