// Only publish the new frontend and permanent public downloads.
import { createDocument } from "@mixmark-io/domino";
import { writeCV } from "./cv.mjs";
import { profileFiles } from "./profile.mjs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const entries = [
  "index.html",
  "workbench",
  "favicon.ico",
  "CV-David_Hall_2018.pdf",
];
await mkdir(new URL("build/", root), { recursive: true });
for (const entry of entries) {
  await cp(new URL("public/" + entry, root), new URL("build/" + entry, root), {
    recursive: true,
  });
}

const html = await readFile(new URL("public/index.html", root), "utf8");
const document = createDocument(html);
await writeCV(document, new URL("build/David-Hall-CV.pdf", root));
for (const [filename, content] of Object.entries(profileFiles(document))) {
  await writeFile(new URL("build/" + filename, root), content);
}
