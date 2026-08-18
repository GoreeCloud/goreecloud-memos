import { create } from "@bufbuild/protobuf";
import { isEqual } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { identityProviderServiceClient } from "@/connect";
import { useInstance } from "@/contexts/InstanceContext";
import useDialog from "@/hooks/useDialog";
import { IdentityProvider } from "@/types/proto/api/v1/idp_service_pb";
import {
  InstanceSetting_GeneralSetting,
  InstanceSetting_GeneralSettingSchema,
  InstanceSetting_Key,
  InstanceSettingSchema,
} from "@/types/proto/api/v1/instance_service_pb";
import { useTranslate } from "@/utils/i18n";
import { GOREECLOUD_MEMOS_DEFAULT_TITLE, resolveInstanceLogoUrl } from "@/utils/instance-branding";
import UpdateCustomizedProfileDialog from "../UpdateCustomizedProfileDialog";
import SettingGroup from "./SettingGroup";
import { SettingList, SettingListItem } from "./SettingList";
import SettingSection from "./SettingSection";
import useInstanceSettingUpdater, { buildInstanceSettingName } from "./useInstanceSettingUpdater";

const hardenGeneralSettingForGoreeCloud = (setting: InstanceSetting_GeneralSetting) =>
  create(InstanceSetting_GeneralSettingSchema, {
    ...setting,
    additionalScript: "",
    additionalStyle: "",
    customProfile: setting.customProfile
      ? {
          ...setting.customProfile,
          logoUrl: resolveInstanceLogoUrl(setting.customProfile.logoUrl),
        }
      : setting.customProfile,
  });

const InstanceSection = () => {
  const t = useTranslate();
  const customizeDialog = useDialog();
  const saveInstanceSetting = useInstanceSettingUpdater();
  const { generalSetting: originalSetting, profile } = useInstance();
  const hardenedOriginalSetting = useMemo(() => hardenGeneralSettingForGoreeCloud(originalSetting), [originalSetting]);
  const [instanceGeneralSetting, setInstanceGeneralSetting] = useState<InstanceSetting_GeneralSetting>(hardenedOriginalSetting);
  const [identityProviderList, setIdentityProviderList] = useState<IdentityProvider[]>([]);

  useEffect(() => {
    setInstanceGeneralSetting(hardenedOriginalSetting);
  }, [hardenedOriginalSetting]);

  const fetchIdentityProviderList = async () => {
    const { identityProviders } = await identityProviderServiceClient.listIdentityProviders({});
    setIdentityProviderList(identityProviders);
  };

  useEffect(() => {
    fetchIdentityProviderList();
  }, []);

  const weekStartDayOptions = useMemo(
    () => [
      { value: "-1", label: t("setting.instance.saturday") },
      { value: "0", label: t("setting.instance.sunday") },
      { value: "1", label: t("setting.instance.monday") },
    ],
    [t],
  );

  const updatePartialSetting = (partial: Partial<InstanceSetting_GeneralSetting>) => {
    setInstanceGeneralSetting(
      create(InstanceSetting_GeneralSettingSchema, {
        ...instanceGeneralSetting,
        ...partial,
        additionalScript: "",
        additionalStyle: "",
      }),
    );
  };

  const handleSaveGeneralSetting = async () => {
    await saveInstanceSetting({
      key: InstanceSetting_Key.GENERAL,
      setting: create(InstanceSettingSchema, {
        name: buildInstanceSettingName(InstanceSetting_Key.GENERAL),
        value: {
          case: "generalSetting",
          value: hardenGeneralSettingForGoreeCloud(instanceGeneralSetting),
        },
      }),
      errorContext: "Update general settings",
    });
  };

  return (
    <SettingSection title={t("setting.system.label")}>
      <SettingGroup title={t("common.basic")} description={t("setting.system.basic-description")}>
        <SettingList>
          <SettingListItem
            label={t("setting.system.server-name")}
            description={instanceGeneralSetting.customProfile?.title || GOREECLOUD_MEMOS_DEFAULT_TITLE}
          >
            <Button variant="outline" onClick={customizeDialog.open}>
              {t("common.edit")}
            </Button>
          </SettingListItem>
        </SettingList>
      </SettingGroup>

      <SettingGroup title={t("setting.instance.access-title")} description={t("setting.instance.access-description")} showSeparator>
        <SettingList>
          <SettingListItem
            label={t("setting.instance.disallow-user-registration")}
            description={t("setting.instance.disallow-user-registration-description")}
          >
            <Switch
              disabled={profile.demo}
              checked={instanceGeneralSetting.disallowUserRegistration}
              onCheckedChange={(checked) => updatePartialSetting({ disallowUserRegistration: checked })}
            />
          </SettingListItem>

          <SettingListItem
            label={t("setting.instance.disallow-password-auth")}
            description={t("setting.instance.disallow-password-auth-description")}
          >
            <Switch
              disabled={profile.demo || (identityProviderList.length === 0 && !instanceGeneralSetting.disallowPasswordAuth)}
              checked={instanceGeneralSetting.disallowPasswordAuth}
              onCheckedChange={(checked) => updatePartialSetting({ disallowPasswordAuth: checked })}
            />
          </SettingListItem>

          <SettingListItem
            label={t("setting.instance.disallow-change-username")}
            description={t("setting.instance.disallow-change-username-description")}
          >
            <Switch
              checked={instanceGeneralSetting.disallowChangeUsername}
              onCheckedChange={(checked) => updatePartialSetting({ disallowChangeUsername: checked })}
            />
          </SettingListItem>

          <SettingListItem
            label={t("setting.instance.disallow-change-nickname")}
            description={t("setting.instance.disallow-change-nickname-description")}
          >
            <Switch
              checked={instanceGeneralSetting.disallowChangeNickname}
              onCheckedChange={(checked) => updatePartialSetting({ disallowChangeNickname: checked })}
            />
          </SettingListItem>

          <SettingListItem label={t("setting.instance.week-start-day")} description={t("setting.instance.week-start-day-description")}>
            <Select
              value={instanceGeneralSetting.weekStartDayOffset.toString()}
              items={weekStartDayOptions}
              onValueChange={(value) => {
                updatePartialSetting({ weekStartDayOffset: parseInt(value) || 0 });
              }}
            >
              <SelectTrigger className="min-w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekStartDayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingListItem>
        </SettingList>
      </SettingGroup>

      <div className="w-full flex justify-end">
        <Button disabled={isEqual(instanceGeneralSetting, hardenedOriginalSetting)} onClick={handleSaveGeneralSetting}>
          {t("common.save")}
        </Button>
      </div>

      <UpdateCustomizedProfileDialog
        open={customizeDialog.isOpen}
        onOpenChange={customizeDialog.setOpen}
        onSuccess={() => {
          toast.success(t("message.update-succeed"));
        }}
      />
    </SettingSection>
  );
};

export default InstanceSection;
