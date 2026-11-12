import { readFile } from "node:fs/promises";
import { join } from "node:path";
import MarkdownIt from "markdown-it";
import { AdminDashboard } from "@/components/admin-dashboard";

const markdown = new MarkdownIt({ html: false, linkify: true });

type Decision = {
  date: string;
  agent: string;
  name: string;
  title: string;
};

type CheckStatus = {
  status: "green" | "red";
  finishedAt: string;
  durationMs: number;
};

function getDecisions(journal: string): Decision[] {
  return journal
    .split("\n")
    .map((line) => line.match(/^##\s+(.+?)\s*$/)?.[1])
    .filter((heading): heading is string => Boolean(heading?.includes("⚖️")))
    .map((heading) => {
      const parts = heading.split("·").map((part) => part.trim());
      const name = parts[2]?.replace(/^⚖️\s*/, "") ?? "Решение";
      return {
        date: parts[0] ?? "",
        agent: parts[1] ?? "",
        name,
        title: parts.slice(3).join(" · ") || name,
      };
    });
}

async function readCheckStatus(): Promise<CheckStatus | null> {
  try {
    const content = await readFile(
      join(process.cwd(), ".check-status.json"),
      "utf8",
    );
    return JSON.parse(content) as CheckStatus;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Закрыто</h1>
        <p className="mt-3">закрыто: задай ADMIN_PASSWORD</p>
      </main>
    );
  }

  const [readme, journal, checkStatus] = await Promise.all([
    readFile(join(process.cwd(), "docs", "README.md"), "utf8"),
    readFile(join(process.cwd(), "docs", "journal.md"), "utf8"),
    readCheckStatus(),
  ]);
  const projectTitle = readme.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Проект";

  return (
    <AdminDashboard
      checkStatus={checkStatus}
      decisions={getDecisions(journal)}
      journalHtml={markdown.render(journal)}
      projectTitle={projectTitle}
      readmeHtml={markdown.render(readme)}
    />
  );
}
