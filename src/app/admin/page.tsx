import { readFile } from "node:fs/promises";
import { join } from "node:path";
import MarkdownIt from "markdown-it";

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
      const decision = parts[2]?.replace(/^⚖️\s*/, "") ?? "Решение";
      return {
        date: parts[0] ?? "",
        agent: parts[1] ?? "",
        name: decision,
        title: parts.slice(3).join(" · ") || decision,
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
  const decisions = getDecisions(journal);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <h1 className="text-3xl font-semibold tracking-tight">
          Администрирование · {projectTitle}
        </h1>
        <a className="text-sm underline underline-offset-4" href="/logout">
          Выйти
        </a>
      </header>

      <section
        aria-labelledby="check-heading"
        className="rounded-lg border border-neutral-200 p-5"
      >
        <h2 className="text-lg font-semibold" id="check-heading">
          Последняя проверка
        </h2>
        {checkStatus ? (
          <p className="mt-2 text-sm">
            {checkStatus.status === "green" ? "Зелёная" : "Красная"} ·{" "}
            {new Date(checkStatus.finishedAt).toLocaleString("ru-RU", {
              timeZone: "Europe/Moscow",
            })}{" "}
            · {checkStatus.durationMs} мс
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">
            Проверка ещё не запускалась.
          </p>
        )}
      </section>

      <section aria-labelledby="decisions-heading">
        <h2 className="mb-3 text-xl font-semibold" id="decisions-heading">
          Решения
        </h2>
        <ul
          className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200"
          data-testid="decision-list"
        >
          {decisions.map((decision, index) => (
            <li
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3"
              key={`${decision.date}-${decision.name}-${index}`}
            >
              <time className="text-sm tabular-nums text-neutral-500">
                {decision.date}
              </time>
              <span className="font-medium">{decision.title}</span>
              <span className="text-sm text-neutral-500">
                {decision.name} · {decision.agent}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="spec-heading">
        <h2 className="mb-3 text-xl font-semibold" id="spec-heading">
          Спецификация проекта
        </h2>
        <article
          className="max-w-none space-y-3 text-sm leading-7 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-neutral-700"
          dangerouslySetInnerHTML={{ __html: markdown.render(readme) }}
        />
      </section>

      <section aria-labelledby="journal-heading">
        <h2 className="mb-3 text-xl font-semibold" id="journal-heading">
          Журнал решений
        </h2>
        <article
          className="max-w-none space-y-3 text-sm leading-7 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-neutral-700"
          dangerouslySetInnerHTML={{ __html: markdown.render(journal) }}
        />
      </section>
    </main>
  );
}
