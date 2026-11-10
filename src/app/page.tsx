import Link from "next/link";
import {
  getProjectSummary,
  getProjectTitle,
  readProjectReadme,
} from "@/lib/project-docs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const readme = await readProjectReadme();
  const title = getProjectTitle(readme);
  const summary = getProjectSummary(readme);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-5 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-xl text-lg leading-8 text-neutral-600">{summary}</p>
      <Link
        className="w-fit rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        href="/admin"
      >
        Панель администратора
      </Link>
    </main>
  );
}
