import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const output = new URL("../build/", import.meta.url);
execFileSync(process.execPath, [
  new URL("build.mjs", import.meta.url).pathname,
]);
const index = await readFile(new URL("index.html", output), "utf8");

test("each terminal file has a matching deep link and keyboard number", () => {
  const entries = [...index.matchAll(/<article\s+id="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const links = [...index.matchAll(/href="#([^"]+)"\s+data-file="(\d+)"/g)];
  assert.equal(entries.length, 6);
  assert.deepEqual(
    links.map((match) => match[1]),
    entries,
  );
  assert.deepEqual(
    links.map((match) => Number(match[2])),
    entries.map((_, i) => i),
  );
});

test("the release contains the linked local files, fonts, modules and archived CVs", async () => {
  const refs = [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  for (const ref of refs.filter((ref) => !/^(?:https?:|mailto:|#)/.test(ref))) {
    await access(new URL(ref, output));
  }
  const css = await readFile(new URL("workbench/console.css", output), "utf8");
  for (const match of css.matchAll(/url\(["']?([^)'"]+)["']?\)/g)) {
    await access(new URL("workbench/" + match[1], output));
  }
  const js = await readFile(new URL("workbench/console.js", output), "utf8");
  for (const match of js.matchAll(/from\s+["']([^"']+)["']/g)) {
    await access(new URL(match[1], new URL("workbench/", output)));
  }
  await access(new URL("CV-David_Hall_2018.pdf", output));
});

test("the discoverable Markdown is a plain-text account of the same career evidence", async () => {
  const markdown = await readFile(new URL("profile.md", output), "utf8");
  const directory = await readFile(new URL("llms.txt", output), "utf8");
  assert.match(directory, /\[Full profile\]\(\/profile\.md\)/);
  assert.match(markdown, /^# David Hall — Principal Engineer/);
  assert.match(markdown, /## Fanatics Betting and Gaming/);
  assert.match(markdown, /Head of Technology · Sep 2021 – Jun 2023/);
  assert.match(markdown, /50% on comparable hardware/);
  assert.match(markdown, /under 100 ms/);
  assert.match(
    markdown,
    /interested in bringing my distributed systems experience to AI infrastructure/,
  );
  assert.doesNotMatch(
    markdown,
    /True colour|<canvas|Tune signal|Profile in Markdown/i,
  );
});
