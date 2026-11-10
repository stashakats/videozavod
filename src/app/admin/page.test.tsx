import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import { expect, test } from "vitest";
import AdminPage from "./page";
import { proxy } from "@/proxy";

test("admin redirects without login and renders the first decision with Basic auth", async () => {
  const envFile = await readFile(
    resolve(process.cwd(), ".env.local"),
    "utf8",
  ).catch(() => "");
  const passwordFromFile = envFile.match(/^ADMIN_PASSWORD=(.*)$/m)?.[1];
  const password = passwordFromFile || process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "Set ADMIN_PASSWORD in .env.local or in the test environment.",
    );
  }

  const originalPassword = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = password;

  try {
    const unauthenticated = proxy(
      new NextRequest("http://localhost/admin?tab=docs"),
    );
    expect(unauthenticated?.status).toBe(307);
    const redirect = new URL(unauthenticated!.headers.get("location")!);
    expect(redirect.pathname).toBe("/login");
    expect(redirect.searchParams.get("next")).toBe("/admin?tab=docs");

    const authorization = `Basic ${Buffer.from(`admin:${password}`).toString("base64")}`;
    const authenticated = proxy(
      new NextRequest("http://localhost/admin", {
        headers: { authorization },
      }),
    );
    expect(authenticated?.status).toBe(200);

    const journal = await readFile(
      resolve(process.cwd(), "docs", "journal.md"),
      "utf8",
    );
    const firstDecision = journal
      .split("\n")
      .find((line) => line.startsWith("##") && line.includes("⚖️"));
    const firstDecisionName = firstDecision
      ?.split("⚖️")[1]
      ?.split("·")[0]
      ?.trim();
    const html = renderToString(await AdminPage());
    const listStart = html.indexOf('data-testid="decision-list"');
    const listEnd = html.indexOf("</ul>", listStart);
    const decisionList = html.slice(listStart, listEnd);

    expect(firstDecisionName).toBeTruthy();
    expect(decisionList).toContain(firstDecisionName);
  } finally {
    if (originalPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = originalPassword;
    }
  }
});
