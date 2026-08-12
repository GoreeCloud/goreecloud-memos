import { create } from "@bufbuild/protobuf";
import { isEqual } from "lodash-es";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useInstance } from "@/contexts/InstanceContext";
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

  return (
    <SettingSection title="Notes">
      <SettingGroup title="Editing" description="Control note editing behavior and server-side content limits.">
        <SettingList>
          <SettingListItem label="Enable double click to edit" description="Open a note for editing by double-clicking its card.">
            <Switch
              checked={memoRelatedSetting.enableDoubleClickEdit}
              onCheckedChange={(checked) => updatePartialSetting({ enableDoubleClickEdit: checked })}
            />
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
