import { create } from "@bufbuild/protobuf";
import { isEqual } from "lodash-es";
import { PaletteIcon, PlusIcon, TagIcon, TrashIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTagCounts, useUpdateUserSetting } from "@/hooks/useUserQueries";
import { colorToHex } from "@/lib/color";
import { buildUserSettingName } from "@/lib/resource-names";
import { isValidTagPattern } from "@/lib/tag";
import { cn } from "@/lib/utils";
import {
  UserSetting_Key,
  UserSetting_TagMetadataSchema,
  UserSetting_TagsSettingSchema,
  UserSettingSchema,
} from "@/types/proto/api/v1/user_service_pb";
import { ColorSchema } from "@/types/proto/google/type/color_pb";
import { normalizeNoteLabel } from "@/utils/noteLabels";
import SettingGroup from "./SettingGroup";
import { SettingList, SettingPanel } from "./SettingList";
import SettingSection from "./SettingSection";

const DEFAULT_TAG_COLOR = "#ffffff";

const hexToColor = (hex: string) =>
  create(ColorSchema, {
    red: parseInt(hex.slice(1, 3), 16) / 255,
    green: parseInt(hex.slice(3, 5), 16) / 255,
    blue: parseInt(hex.slice(5, 7), 16) / 255,
  });

interface LocalTagMeta {
  color?: string;
  blur: boolean;
}

const toLocalTagMeta = (meta: {
  backgroundColor?: { red?: number; green?: number; blue?: number };
  blurContent: boolean;
}): LocalTagMeta => ({
  color: colorToHex(meta.backgroundColor),
  blur: meta.blurContent,
});

const TagsSection = () => {
  const { currentUser, userTagsSetting, refetchSettings } = useAuth();
  const { mutateAsync: updateUserSetting } = useUpdateUserSetting();
  const { data: tagCounts = {} } = useTagCounts(true);
  const originalSetting = useMemo(() => userTagsSetting ?? create(UserSetting_TagsSettingSchema, {}), [userTagsSetting]);

  const [localTags, setLocalTags] = useState<Record<string, LocalTagMeta>>(() =>
    Object.fromEntries(Object.entries(originalSetting.tags).map(([name, meta]) => [name, toLocalTagMeta(meta)])),
  );
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLocalTags(Object.fromEntries(Object.entries(originalSetting.tags).map(([name, meta]) => [name, toLocalTagMeta(meta)])));
  }, [originalSetting.tags]);

  const configuredEntries = useMemo(
    () =>
      Object.keys(localTags)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ name, count: tagCounts[name] ?? 0 })),
    [localTags, tagCounts],
  );

  const originalMetaMap = useMemo(
    () => Object.fromEntries(Object.entries(originalSetting.tags).map(([name, meta]) => [name, toLocalTagMeta(meta)])),
    [originalSetting.tags],
  );
  const hasChanges = !isEqual(localTags, originalMetaMap);

  const handleColorChange = (labelName: string, hex: string) => {
    setLocalTags((prev) => ({ ...prev, [labelName]: { ...prev[labelName], color: hex } }));
  };

  const handleClearColor = (labelName: string) => {
    setLocalTags((prev) => ({ ...prev, [labelName]: { ...prev[labelName], color: undefined } }));
  };

  const handleRemoveLabel = (labelName: string) => {
    if ((tagCounts[labelName] ?? 0) > 0) {
      toast.error("Remove this label from its notes before deleting it from the label list.");
      return;
    }

    setLocalTags((prev) => {
      const next = { ...prev };
      delete next[labelName];
      return next;
    });
  };

  const handleAddLabel = () => {
    const name = normalizeNoteLabel(newLabelName);
    if (!name || name !== newLabelName.trim().replace(/^#+/, "")) {
      toast.error("Use a single label name without spaces. Hyphens are supported for multi-word labels.");
      return;
    }
    if (Object.hasOwn(localTags, name)) {
      toast.error("That label already exists.");
      return;
    }
    if (!isValidTagPattern(name)) {
      toast.error("That label name is not supported by the current notes index.");
      return;
    }

    setLocalTags((prev) => ({ ...prev, [name]: { color: newLabelColor, blur: false } }));
    setNewLabelName("");
    setNewLabelColor(undefined);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    const tags = Object.fromEntries(
      Object.entries(localTags).map(([name, meta]) => [
        name,
        create(UserSetting_TagMetadataSchema, {
          blurContent: meta.blur,
          ...(meta.color ? { backgroundColor: hexToColor(meta.color) } : {}),
        }),
      ]),
    );

    await updateUserSetting({
      setting: create(UserSettingSchema, {
        name: buildUserSettingName(currentUser.name, UserSetting_Key.TAGS),
        value: {
          case: "tagsSetting",
          value: create(UserSetting_TagsSettingSchema, { tags }),
        },
      }),
      updateMask: ["tags"],
    });
    await refetchSettings();
    toast.success("Labels saved");
  };

  return (
    <SettingSection title="Labels">
      <SettingGroup
        title="Organize notes with labels"
        description="Create labels here, then assign them from a note's menu. GoreeCloud Notes stores labels as portable Markdown tags so they remain searchable and exportable."
      >
        <SettingPanel footer={<span className="text-xs text-muted-foreground">Multi-word labels currently use hyphens, for example family-records.</span>}>
          <div className="flex flex-col gap-3 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <PlusIcon className="size-3.5" />
                <span>Create label</span>
              </div>
              <Button variant="outline" onClick={handleAddLabel} disabled={!newLabelName.trim()}>
                <PlusIcon className="mr-1.5 size-4" />
                Add label
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_auto] sm:items-center">
              <Input
                placeholder="Label name"
                value={newLabelName}
                onChange={(event) => setNewLabelName(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleAddLabel()}
                aria-label="Label name"
              />

              <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-2 text-sm text-muted-foreground">
                <PaletteIcon className="size-4" />
                <span>Color</span>
                <input
                  type="color"
                  className="size-6 cursor-pointer rounded border border-border bg-transparent p-0.5"
                  value={newLabelColor ?? DEFAULT_TAG_COLOR}
                  onChange={(event) => setNewLabelColor(event.target.value)}
                  aria-label="New label color"
                />
                <Button variant="ghost" size="sm" onClick={() => setNewLabelColor(undefined)} disabled={!newLabelColor} className="h-6 px-1.5">
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </SettingPanel>

        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-muted-foreground">Your labels</h4>
          <Badge variant="outline" className="rounded-md px-2 py-0 text-xs font-normal">
            {configuredEntries.length}
          </Badge>
        </div>

        <SettingList>
          {configuredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <TagIcon className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No labels yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">Create your first label above. It will appear in the Notes sidebar and in each note's Labels menu.</p>
            </div>
          ) : (
            configuredEntries.map((row) => (
              <div key={row.name} className="grid gap-3 px-3 py-3 sm:grid-cols-[minmax(12rem,1fr)_auto_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <TagIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-muted-foreground">Used by {row.count} {row.count === 1 ? "note" : "notes"}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn("size-5 rounded-full border border-border", !localTags[row.name].color && "bg-background")}
                    style={{ backgroundColor: localTags[row.name].color ?? DEFAULT_TAG_COLOR }}
                    aria-hidden
                  />
                  <input
                    type="color"
                    className="size-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                    value={localTags[row.name].color ?? DEFAULT_TAG_COLOR}
                    onChange={(event) => handleColorChange(row.name, event.target.value)}
                    aria-label={`Color for ${row.name}`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleClearColor(row.name)} disabled={!localTags[row.name].color}>
                    {localTags[row.name].color ? "Clear" : "Default"}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveLabel(row.name)}
                  aria-label={`Delete ${row.name} label`}
                  title={(tagCounts[row.name] ?? 0) > 0 ? "Remove this label from its notes before deleting it" : "Delete label"}
                >
                  <TrashIcon className="size-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </SettingList>
      </SettingGroup>

      <div className="flex w-full justify-end">
        <Button disabled={!hasChanges || !currentUser} onClick={handleSave}>
          Save labels
        </Button>
      </div>
    </SettingSection>
  );
};

export default TagsSection;
