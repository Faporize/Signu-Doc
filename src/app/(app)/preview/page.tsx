import { PreviewShell } from "@/components/preview/preview-shell";
import { getAuthSession } from "@/lib/auth/server";
import { readPreviewSettings } from "@/lib/preview-settings";

type PreviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const session = await getAuthSession();
  const defaultSender =
    session?.user.name?.trim() || session?.user.email || "Sender";
  const settings = readPreviewSettings(await searchParams, defaultSender);

  return <PreviewShell settings={settings} />;
}
