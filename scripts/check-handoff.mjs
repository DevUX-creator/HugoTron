import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
const folder = "docs/handoff";
const files = [
  "README.md",
  "src/commerce/README.md",
  "assets-src/README.md",
  ...(await readdir(folder))
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(folder, file)),
];
const broken = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    try {
      await stat(path.resolve(path.dirname(file), decodeURIComponent(target)));
    } catch {
      broken.push(`${file} → ${target}`);
    }
  }
}
if (broken.length) {
  console.error(broken.join("\n"));
  process.exitCode = 1;
} else console.log(`Handoff links checked in ${files.length} documents.`);
