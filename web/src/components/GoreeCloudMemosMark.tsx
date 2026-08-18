import { cn } from "@/lib/utils";
import { resolveInstanceLogoUrl } from "@/utils/instance-branding";

interface Props {
  className?: string;
  logoUrl?: string;
}

const GoreeCloudMemosMark = ({ className, logoUrl }: Props) => (
  <img
    className={cn("gc-brand-mark select-none object-contain", className)}
    src={resolveInstanceLogoUrl(logoUrl)}
    alt=""
    draggable={false}
  />
);

export default GoreeCloudMemosMark;
