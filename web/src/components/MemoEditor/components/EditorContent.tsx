import { forwardRef } from "react";
import Editor from "../Editor";
import { useEditorContext, useEditorSelector } from "../state";
import type { EditorContentProps } from "../types";
import type { EditorController } from "../types/editorController";
import { composeNoteContent, splitNoteTitle } from "../utils/noteTitle";

// Imported eagerly (not React.lazy): the editor is the always-present compose
// box on the home route, which is already code-split — so deferring the
// CodeMirror bundle separately bought nothing and made the editor paint empty
// for a beat before its placeholder appeared (a visible flicker on load).

/**
 * Hosts the CodeMirror Editor behind the EditorController contract. The
 * editor serializes into state.content on every change and exposes its
 * formatting capability for the focus-mode toolbar.
 */
export const EditorContent = forwardRef<EditorController, EditorContentProps>(({ placeholder, separateTitle, onSubmit, onFiles }, ref) => {
  const { actions, dispatch } = useEditorContext();
  const content = useEditorSelector((s) => s.content);
  const isFocusMode = useEditorSelector((s) => s.ui.isFocusMode);
  const noteParts = splitNoteTitle(content);
  const editorContent = separateTitle ? noteParts.body : content;

  const handleContentChange = (nextContent: string) => {
    dispatch(actions.updateContent(separateTitle ? composeNoteContent(noteParts.title, nextContent) : nextContent));
  };

  return (
    <div className="w-full flex flex-col flex-1">
      <Editor
        ref={ref}
        className="memo-editor-content"
        initialContent={editorContent}
        placeholder={placeholder || ""}
        isFocusMode={isFocusMode}
        onContentChange={handleContentChange}
        onFiles={onFiles}
        onSubmit={onSubmit}
      />
    </div>
  );
});

EditorContent.displayName = "EditorContent";
