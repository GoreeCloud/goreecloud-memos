export type MemoEditTrigger = "single" | "double";

export const memoEditTriggerFromSetting = (enableDoubleClickEdit: boolean): MemoEditTrigger =>
  enableDoubleClickEdit ? "double" : "single";

export const enableDoubleClickEditFromTrigger = (trigger: MemoEditTrigger): boolean => trigger === "double";

const MEMO_EDIT_INTERACTIVE_TARGET_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "summary",
  "audio",
  "video",
  "img",
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[contenteditable="true"]',
  "[data-memo-edit-ignore]",
].join(", ");

export const isMemoEditInteractionTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest(MEMO_EDIT_INTERACTIVE_TARGET_SELECTOR));
};

export const shouldOpenMemoEditor = ({
  readonly,
  trigger,
  interaction,
  target,
}: {
  readonly: boolean;
  trigger: MemoEditTrigger;
  interaction: MemoEditTrigger;
  target: EventTarget | null;
}): boolean => !readonly && trigger === interaction && !isMemoEditInteractionTarget(target);
