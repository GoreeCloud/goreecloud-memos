import { create } from "@bufbuild/protobuf";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInstance } from "@/contexts/InstanceContext";
import { handleError } from "@/lib/error";
import { buildInstanceSettingName } from "@/lib/resource-names";
import {
  InstanceSetting_GeneralSetting_CustomProfile,
  InstanceSetting_GeneralSetting_CustomProfileSchema,
  InstanceSetting_Key,
  InstanceSettingSchema,
} from "@/types/proto/api/v1/instance_service_pb";
import {
  GOREECLOUD_MEMOS_DEFAULT_LOGO_URL,
  GOREECLOUD_MEMOS_DEFAULT_TITLE,
  isSafeLocalBrandAssetPath,
  resolveInstanceLogoUrl,
} from "@/utils/instance-branding";
import { useTranslate } from "@/utils/i18n";

const MAX_PROFILE_TITLE_LENGTH = 80;
const MAX_PROFILE_DESCRIPTION_LENGTH = 280;
const MAX_PROFILE_LOGO_PATH_LENGTH = 2048;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function UpdateCustomizedProfileDialog({ open, onOpenChange, onSuccess }: Props) {
  const t = useTranslate();
  const { generalSetting: instanceGeneralSetting, updateSetting } = useInstance();
  const existingProfile = instanceGeneralSetting.customProfile;
  const [customProfile, setCustomProfile] = useState<InstanceSetting_GeneralSetting_CustomProfile>(
    create(InstanceSetting_GeneralSetting_CustomProfileSchema, {
      title: existingProfile?.title || GOREECLOUD_MEMOS_DEFAULT_TITLE,
      description: existingProfile?.description || "",
      logoUrl: resolveInstanceLogoUrl(existingProfile?.logoUrl),
    }),
  );

  const [isLoading, setIsLoading] = useState(false);

  const setPartialState = (partialState: Partial<InstanceSetting_GeneralSetting_CustomProfile>) => {
    setCustomProfile((state) => ({
      ...state,
      ...partialState,
    }));
  };

  const handleNameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({ title: e.target.value });
  };

  const handleLogoUrlChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({ logoUrl: e.target.value });
  };

  const handleDescriptionChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPartialState({ description: e.target.value });
  };

  const handleRestoreButtonClick = () => {
    setPartialState({
      title: GOREECLOUD_MEMOS_DEFAULT_TITLE,
      logoUrl: GOREECLOUD_MEMOS_DEFAULT_LOGO_URL,
      description: "",
    });
  };

  const handleCloseButtonClick = () => {
    onOpenChange(false);
  };

  const handleSaveButtonClick = async () => {
    const title = customProfile.title.trim();
    const description = customProfile.description.trim();
    const logoUrl = customProfile.logoUrl.trim() || GOREECLOUD_MEMOS_DEFAULT_LOGO_URL;

    if (!title) {
      toast.error("Title cannot be empty.");
      return;
    }
    if (!isSafeLocalBrandAssetPath(logoUrl)) {
      toast.error("Icon must use a local path beginning with / and cannot use a remote URL.");
      return;
    }

    setIsLoading(true);
    try {
      await updateSetting(
        create(InstanceSettingSchema, {
          name: buildInstanceSettingName(InstanceSetting_Key.GENERAL),
          value: {
            case: "generalSetting",
            value: {
              ...instanceGeneralSetting,
              additionalScript: "",
              additionalStyle: "",
              customProfile: {
                ...customProfile,
                title,
                description,
                logoUrl,
              },
            },
          },
        }),
      );
      toast.success(t("message.update-succeed"));
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      handleError(error, toast.error, {
        context: "Update customized profile",
        fallbackMessage: "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("setting.system.customize-server.title")}</DialogTitle>
          <DialogDescription>Customize the local GoreeCloud Memos identity without loading third-party branding assets.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="server-name">{t("setting.system.server-name")}</Label>
            <Input
              id="server-name"
              type="text"
              value={customProfile.title}
              maxLength={MAX_PROFILE_TITLE_LENGTH}
              onChange={handleNameChanged}
              placeholder="Enter server name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon-url">{t("setting.system.customize-server.icon-url")}</Label>
            <Input
              id="icon-url"
              type="text"
              value={customProfile.logoUrl}
              maxLength={MAX_PROFILE_LOGO_PATH_LENGTH}
              onChange={handleLogoUrlChanged}
              placeholder={GOREECLOUD_MEMOS_DEFAULT_LOGO_URL}
              aria-describedby="icon-url-help"
            />
            <p id="icon-url-help" className="text-xs leading-relaxed text-muted-foreground">
              Use a local path such as {GOREECLOUD_MEMOS_DEFAULT_LOGO_URL}. Remote and protocol-relative URLs are blocked for privacy and security.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{t("setting.system.customize-server.description")}</Label>
            <Textarea
              id="description"
              rows={3}
              value={customProfile.description}
              maxLength={MAX_PROFILE_DESCRIPTION_LENGTH}
              onChange={handleDescriptionChanged}
              placeholder="Enter description"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={handleRestoreButtonClick} disabled={isLoading} className="sm:mr-auto">
            {t("common.restore")}
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={handleCloseButtonClick} disabled={isLoading} className="flex-1 sm:flex-initial">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveButtonClick} disabled={isLoading} className="flex-1 sm:flex-initial">
              {isLoading ? "Saving..." : t("common.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpdateCustomizedProfileDialog;
