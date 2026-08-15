import { ExternalLinkIcon } from "lucide-react";
import GoreeCloudNotesMark from "@/components/GoreeCloudNotesMark";
import { Badge } from "@/components/ui/badge";
import { useInstance } from "@/contexts/InstanceContext";
import { useTranslate } from "@/utils/i18n";

const GOREECLOUD_COMMIT_URL_PREFIX = "https://github.com/GoreeCloud/memos/commit/";
const GOREECLOUD_SOURCE_URL = "https://github.com/GoreeCloud/memos";
const NATIVE_NOTES_URL = "https://github.com/GoreeCloud/goreecloud-notes";
const UPSTREAM_MEMOS_URL = "https://github.com/usememos/memos";
const LICENSE_URL = "https://github.com/GoreeCloud/memos/blob/main/LICENSE";

const DEFAULT_TITLE = "GoreeCloud Notes";
const DEFAULT_TAGLINE = "Private notes. Portable data. GoreeCloud control.";

const isCommitSha = (commit: string) => /^[0-9a-f]{7,40}$/i.test(commit);

const Chip = ({ href, children }: { href?: string; children: React.ReactNode }) => {
  const className = "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground";
  if (href) {
    return (
      <a className={`${className} hover:bg-accent hover:text-foreground`} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return <span className={className}>{children}</span>;
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">{children}</h2>
);

const LinkRow = ({ label, note, href }: { label: string; note: string; href: string }) => (
  <a
    className="group flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-b-0"
    href={href}
    target="_blank"
    rel="noreferrer"
  >
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate text-[13px] font-medium text-foreground group-hover:underline group-hover:underline-offset-2">{label}</span>
      <span className="hidden truncate text-xs text-muted-foreground sm:inline">{note}</span>
    </span>
    <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
  </a>
);

const About = () => {
  const t = useTranslate();
  const { profile, generalSetting } = useInstance();

  const customProfile = generalSetting.customProfile;
  const instanceTitle = customProfile?.title || DEFAULT_TITLE;
  const instanceTagline = customProfile?.description || DEFAULT_TAGLINE;
  const hasCommitSha = isCommitSha(profile.commit);
  const commitUrl = hasCommitSha ? `${GOREECLOUD_COMMIT_URL_PREFIX}${profile.commit}` : "";
  const shortCommit = hasCommitSha ? profile.commit.slice(0, 7) : "";

  const buildRows: { label: string; value: React.ReactNode }[] = [];
  if (profile.version) {
    buildRows.push({ label: t("common.version"), value: <Chip>{profile.version}</Chip> });
  }
  if (shortCommit) {
    buildRows.push({ label: t("about.commit"), value: <Chip href={commitUrl}>{shortCommit}</Chip> });
  }
  buildRows.push({ label: t("about.license"), value: <Chip href={LICENSE_URL}>MIT</Chip> });
  buildRows.push({ label: "Role", value: <span className="text-[13px] text-muted-foreground">Transitional Notes source</span> });

  return (
    <section className="gc-route-page min-h-full w-full px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="gc-route-hero rounded-[1.5rem] px-5 py-6 sm:px-7">
          <div className="flex items-start gap-4">
            <GoreeCloudNotesMark className="size-12" logoUrl={customProfile?.logoUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-[-0.025em] text-foreground">{instanceTitle}</h1>
                {profile.demo && <Badge variant="warning">{t("about.demo")}</Badge>}
              </div>
              <p className="mt-1 text-[1.7rem] font-light leading-tight tracking-[-0.025em] text-foreground">{instanceTagline}</p>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
            This repository is the protected Memos-derived GoreeCloud Notes implementation retained for migration, compatibility, data
            continuity, and recovery while the long-term native GoreeCloud Notes application is developed independently.
          </p>
        </header>

        <section className="mt-7">
          <SectionLabel>Build</SectionLabel>
          <dl className="gc-context-surface mt-2.5 rounded-2xl px-4">
            {buildRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[120px_1fr] items-center border-b border-border/60 py-2.5 last:border-b-0">
                <dt className="text-[13px] text-muted-foreground">{row.label}</dt>
                <dd className="m-0 flex min-w-0 items-center">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-7">
          <SectionLabel>GoreeCloud project</SectionLabel>
          <nav aria-label="GoreeCloud Notes project links" className="gc-context-surface mt-2.5 rounded-2xl px-4">
            <LinkRow label="Transitional source" note="Migration, compatibility, and recovery source" href={GOREECLOUD_SOURCE_URL} />
            <LinkRow label="Native GoreeCloud Notes" note="Long-term original application" href={NATIVE_NOTES_URL} />
          </nav>
        </section>

        <section className="mt-7">
          <SectionLabel>Source & attribution</SectionLabel>
          <div className="gc-context-surface mt-2.5 rounded-2xl px-4">
            <LinkRow label="Upstream Memos" note="Original open-source project" href={UPSTREAM_MEMOS_URL} />
            <LinkRow label="MIT License" note="License preserved with this source" href={LICENSE_URL} />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            GoreeCloud branding does not remove or replace required upstream copyright, license, or source attribution.
          </p>
        </section>
      </div>
    </section>
  );
};

export default About;
