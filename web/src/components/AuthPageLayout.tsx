import { ArrowRightIcon, CompassIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useInstance } from "@/contexts/InstanceContext";
import { ROUTES } from "@/router/routes";
import { useTranslate } from "@/utils/i18n";
import AuthFooter from "./AuthFooter";
import GoreeCloudMemosMark from "./GoreeCloudMemosMark";

interface Props {
  chip?: React.ReactNode;
  title: string;
  subtitle?: string;
  // Hide the explore band on pages that should not offer an exit, such as first-run setup.
  hideExplore?: boolean;
  children: React.ReactNode;
}

export const AuthChip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-accent/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
    {children}
  </span>
);

export const AuthEmptyState = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center py-2 text-center">
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-muted-foreground">{icon}</div>
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    {children}
  </div>
);

export const AuthLinkPrompt = ({ prompt, to, label }: { prompt: string; to: string; label: string }) => (
  <p className="mt-5 text-center text-sm text-muted-foreground">
    {prompt}{" "}
    <Link to={to} className="text-primary hover:underline" viewTransition>
      {label}
    </Link>
  </p>
);

export const AuthOptionsLoading = () => <div className="h-9 w-full animate-pulse rounded-md bg-muted/60" aria-hidden="true" />;

const AuthPageLayout = ({ chip, title, subtitle, hideExplore, children }: Props) => {
  const t = useTranslate();
  const { generalSetting, profile } = useInstance();
  const showExplore = Boolean(profile.instanceUrl) && !hideExplore;
  const productTitle = generalSetting.customProfile?.title || "GoreeCloud Memos";

  return (
    <div className="gc-auth-page min-h-dvh w-full flex flex-col items-center overflow-y-auto overscroll-y-contain px-4 py-4 max-[599px]:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:min-h-svh sm:py-8">
      <div className="gc-auth-main w-full grow flex flex-col justify-center items-center max-[599px]:grow-0 max-[599px]:justify-start max-[599px]:pt-[clamp(1.5rem,7dvh,4rem)]">
        <div className="gc-route-hero gc-auth-card w-90 max-w-full rounded-2xl p-7 shadow-md max-[599px]:!p-5">
          <div className="mb-4 flex items-center gap-2.5 sm:mb-6">
            <GoreeCloudMemosMark className="size-7" logoUrl={generalSetting.customProfile?.logoUrl} />
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-[-0.01em] text-foreground">{productTitle}</span>
              <span className="block text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Quick capture</span>
            </div>
          </div>
          {chip && <div className="mb-2">{chip}</div>}
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground max-[599px]:!text-[0.9rem]">{subtitle}</p>}
          <div className="mt-5 w-full sm:mt-6">{children}</div>
          {showExplore && (
            <div className="-mx-7 -mb-7 mt-6 rounded-b-2xl border-t border-border bg-background/45 max-[599px]:-mx-5 max-[599px]:-mb-5 max-[599px]:mt-5">
              <Link
                to={ROUTES.EXPLORE}
                className="group flex items-center justify-center gap-2 px-7 py-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                viewTransition
              >
                <CompassIcon className="h-3.5 w-3.5" />
                {t("auth.explore-public-memos")}
                <ArrowRightIcon className="-ml-1 h-3.5 w-3.5 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100" />
              </Link>
            </div>
          )}
        </div>
      </div>
      <AuthFooter className="max-[599px]:mt-5 max-[599px]:shrink-0" />
    </div>
  );
};

export default AuthPageLayout;
