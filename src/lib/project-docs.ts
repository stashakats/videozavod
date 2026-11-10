import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readProjectReadme(): Promise<string> {
  return readFile(join(process.cwd(), "docs", "README.md"), "utf8");
}

export function getProjectTitle(readme: string): string {
  return readme.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "videozavod";
}

export function getProjectSummary(readme: string): string {
  const section = readme.match(/^## Что это\s*\n([\s\S]*?)(?=\n## |$)/m)?.[1];
  const paragraph = section?.trim().split(/\n\s*\n/)[0];
  const firstSentence = paragraph?.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return (
    firstSentence?.replace(/^videozavod\s+—\s+/i, "") ??
    "Локальная установка генератора коротких видео."
  );
}
