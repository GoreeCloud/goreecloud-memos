import { create } from "@bufbuild/protobuf";
import { isEqual } from "lodash-es";
import { useEffect, useState } from "react";
import { memoEditTriggerFromSetting, enableDoubleClickEditFromTrigger, type MemoEditTrigger } from "@/components/MemoView/editTrigger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useInstance } from "@/contexts/InstanceContext";
import { cn } from "@/lib/utils";
import {
  InstanceSetting_Key,
  InstanceSetting_MemoRelatedSetting,
  InstanceSetting_MemoRelatedSettingSchema,
  InstanceSettingSchema,
} from "@/types/proto/api/v1/instance_service_pb";
import SettingGroup from "./SettingGroup";
import { SettingList, SettingListItem } from "./SettingList";
import SettingSection from "./SettingSection";
import useInstanceSettingUpdater, { buildInstanceSettingName } from "./useInstanceSettingUpdater";

const EDIT_TRIGGER_OPTIONS: Array<{ value: MemoEditTrigger; label: string; description: string }> = [
  {
    value: "single",
    label: "Single click to edit",
    description: "Open the editor with one click on note content.",
  },
  {
    value: "double",
    label: "Double click to edit",
    description: "Open the editor with a double click on note content.",
  },
];

const MemoRelatedSettings = () => {
  const saveInstanceSetting = useInstanceSettingUpdater();
  const { memoRelatedSetting: originalSetting } = useInstance();
  const [memoRelatedSetting, setMemoRelatedSetting] = useState<InstanceSetting_MemoRelatedSetting>(originalSetting);

  useEffect(() => {
    setMemoRelatedSetting(originalSetting);
  }, [originalSetting]);

  const updatePartialSetting = (partial: Partial<InstanceSetting_MemoRelatedSetting>) => {
    setMemoRelatedSetting(
      create(InstanceSetting_MemoRelatedSettingSchema, {
        ...memoRelatedSetting,
        ...partial,
      }),
    );
  };

  const handleUpdateSetting = async () => {
    await saveInstanceSetting({
      key: InstanceSetting_Key.MEMO_RELATED,
      setting: create(InstanceSettingSchema, {
        name: buildInstanceSettingName(InstanceSetting_Key.MEMO_RELATED),
        value: {
          case: "memoRelatedSetting",
          value: memoRelatedSetting,
        },
      }),
      errorContext: "Update Notes settings",
    });
  };

  const editTrigger = memoEditTriggerFromSetting(memoRelatedSetting.enableDoubleClickEdit);

  const handleEditTriggerChange = (value: string) => {
    if (value !== "single" && value !== "double") {
      return;
    }

    updatePartialSetting({ enableDoubleClickEdit: enableDoubleClickEditFromTrigger(value) });
  };

  return (
    <SettingSection title="Notes">
      <SettingGroup title="Editing" description="Choose how note content opens for editing and set server-side content limits.">
        <SettingList>
          <SettingListItem
            vertical
            label="Edit trigger"
            description="Choose the pointer gesture that opens editable note content. Links, labels, checkboxes, and media keep their own actions."
          >
            <RadioGroup
              aria-label="Edit trigger"
              className="w-full gap-2 sm:grid-cols-2"
              value={editTrigger}
              onValueChange={handleEditTriggerChange}
            >
              {EDIT_TRIGGER_OPTIONS.map((option) => {
                const selected = editTrigger === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex min-h-20 cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/10 px-3 py-3 transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-px hover:bg-muted/20 focus-within:ring-2 focus-within:ring-ring/40",
                      selected && "border-primary/35 bg-primary/5 shadow-sm",
                    )}
                  >
                    <RadioGroupItem className="mt-0.5" value={option.value} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </SettingListItem>

          <SettingListItem label="Content length limit" description="Maximum note body size accepted by the server.">
            <div className="flex items-center gap-2">
              <Input
                className="w-28 font-mono"
                type="number"
                min={0}
                value={memoRelatedSetting.contentLengthLimit}
                onChange={(event) => updatePartialSetting({ contentLengthLimit: Number(event.target.value) })}
              />
              <span className="text-xs text-muted-foreground">bytes</span>
            </div>
          </SettingListItem>
        </SettingList>
      </SettingGroup>

      <div className="flex w-full justify-end">
        <Button disabled={isEqual(memoRelatedSetting, originalSetting)} onClick={handleUpdateSetting}>
          Save
        </Button>
      </div>
    </SettingSection>
  );
};

export default MemoRelatedSettings;
