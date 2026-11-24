// Builds data/tasks.json: the open tasks for each project page, from our OpenProject
// instance (API v3). Run with `npm run tasks`; also runs in `npm run build`.
//
// Only pages that opt in are looked up. In a project's front matter:
//
//   openproject: ["blueberry-fields"]     # OpenProject project identifiers; their subprojects are included
//   tasksMatch: "apple"                   # optional: keep only tasks whose title matches (regex, case-insensitive)
//   tasksExclude: "apple"                 # optional: drop tasks whose title matches
//
// To take only some tasks from one of several projects, give that entry its own filter:
//
//   openproject: ["syntropic-food-forest-1", {"project": "orchard-and-food-forest-systems", "match": "food forest"}]
//
// Everything written to data/tasks.json is published on the website and committed to the
// repository, so only the task title, priority and dates are kept: no descriptions, no
// assignees, and nothing from OpenProject projects that no page asks for.
//
// Needs OPENPROJECT_TOKEN (an OpenProject API access token) in the environment or in
// .env.local. Without it, or if the tracker is unreachable, the existing file is kept.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const BASE = "https://tasks.elphinstone.farm";
const CONTENT = new URL("../content/projects/", import.meta.url);
const OUTPUT = new URL("../data/tasks.json", import.meta.url);
const ENV_FILE = new URL("../.env.local", import.meta.url);
const PAGE_SIZE = 200;
// Work package types that group other work rather than being something to do.
const SKIP_TYPES = new Set(["Summary task", "Epic"]);

async function token() {
  if (process.env.OPENPROJECT_TOKEN) return process.env.OPENPROJECT_TOKEN;
  if (!existsSync(ENV_FILE)) return null;
  const line = (await readFile(ENV_FILE, "utf8")).match(/^\s*OPENPROJECT_TOKEN\s*=\s*(.*)$/m);
  return line ? line[1].trim().replace(/^["']|["']$/g, "") : null;
}

// Every element of a paginated OpenProject collection.
async function collection(path, auth, params = {}) {
  const all = [];
  for (let offset = 1; ; offset++) {
    const url = new URL(`${BASE}/api/v3${path}`);
    for (const [key, value] of Object.entries({ ...params, pageSize: PAGE_SIZE, offset })) url.searchParams.set(key, value);
    const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/hal+json" } });
    if (!res.ok) throw new Error(`OpenProject answered ${res.status} ${res.statusText} for ${path}`);
    const body = await res.json();
    all.push(...body._embedded.elements);
    if (all.length >= body.total || body._embedded.elements.length === 0) return all;
  }
}

// The task settings in each project page's front matter, keyed by page folder name.
async function pageSettings() {
  const pages = {};
  for (const entry of await readdir(CONTENT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = new URL(`${entry.name}/index.md`, CONTENT);
    if (!existsSync(file)) continue;
    const frontMatter = (await readFile(file, "utf8")).split(/^---\s*$/m)[1] ?? "";
    const list = frontMatter.match(/^openproject:\s*(\[.*\])\s*(?:#.*)?$/m);
    if (!list) continue;
    const pattern = (key) => {
      const found = frontMatter.match(new RegExp(`^${key}:\\s*"(.*)"\\s*(?:#.*)?$`, "m"));
      return found ? new RegExp(found[1], "i") : null;
    };
    pages[entry.name] = { identifiers: JSON.parse(list[1]), match: pattern("tasksMatch"), exclude: pattern("tasksExclude") };
  }
  return pages;
}

const idOf = (link) => (link?.href ? Number(link.href.split("/").pop()) : null);

async function main() {
  const pages = await pageSettings();
  const secret = await token();
  if (!secret) throw new Error("no OPENPROJECT_TOKEN in the environment or .env.local");
  const auth = "Basic " + Buffer.from(`apikey:${secret}`).toString("base64");

  // Each mapped project plus all of its subprojects.
  const projects = await collection("/projects", auth);
  const byIdentifier = new Map(projects.map((p) => [p.identifier, p]));
  const children = new Map();
  for (const p of projects) {
    const parent = idOf(p._links.parent);
    if (parent) children.set(parent, [...(children.get(parent) ?? []), p.id]);
  }
  const withSubprojects = (id) => [id, ...(children.get(id) ?? []).flatMap(withSubprojects)];

  const wanted = {};
  for (const [slug, page] of Object.entries(pages)) {
    // OpenProject project id → the title filter for tasks taken from it (null = all of them).
    wanted[slug] = new Map();
    for (const entry of page.identifiers) {
      const { project: identifier, match = null } = typeof entry === "string" ? { project: entry } : entry;
      const project = byIdentifier.get(identifier);
      if (!project) console.warn(`tasks: ${slug} asks for OpenProject project "${identifier}", which doesn't exist`);
      else withSubprojects(project.id).forEach((id) => wanted[slug].set(id, match && new RegExp(match, "i")));
    }
  }
  const projectIds = [...new Set(Object.values(wanted).flatMap((ids) => [...ids.keys()]))];

  const priorities = await collection("/priorities", auth);
  const rank = new Map(priorities.map((p) => [p.id, p.position]));
  const normal = priorities.find((p) => p.isDefault)?.position ?? 0;

  const open = projectIds.length
    ? await collection("/work_packages", auth, {
        filters: JSON.stringify([
          { project: { operator: "=", values: projectIds.map(String) } },
          { status: { operator: "o", values: [] } },
        ]),
      })
    : [];
  // A task with open subtasks is a heading for them, not a next step.
  const parents = new Set(open.map((w) => idOf(w._links.parent)));

  const data = {};
  let total = 0;
  for (const [slug, page] of Object.entries(pages)) {
    const seen = new Set();
    data[slug] = open
      .filter((w) => {
        const project = idOf(w._links.project);
        return wanted[slug].has(project) && (wanted[slug].get(project)?.test(w.subject) ?? true);
      })
      .filter((w) => !SKIP_TYPES.has(w._links.type.title) && !parents.has(w.id))
      .filter((w) => (!page.match || page.match.test(w.subject)) && !(page.exclude && page.exclude.test(w.subject)))
      // Most urgent first, then the nearest due date, then whatever was touched most recently.
      .sort(
        (a, b) =>
          (rank.get(idOf(b._links.priority)) ?? 0) - (rank.get(idOf(a._links.priority)) ?? 0) ||
          (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
          b.updatedAt.localeCompare(a.updatedAt),
      )
      // The tracker has a few tasks entered twice.
      .filter((w) => {
        const key = w.subject.trim().toLowerCase();
        return !seen.has(key) && seen.add(key);
      })
      .map((w) => {
        const title = w.subject.trim();
        const task = { title: title[0].toUpperCase() + title.slice(1) };
        if ((rank.get(idOf(w._links.priority)) ?? 0) > normal) task.priority = w._links.priority.title;
        if (w.startDate) task.start = w.startDate;
        if (w.dueDate ?? w.date) task.due = w.dueDate ?? w.date;
        return task;
      });
    total += data[slug].length;
  }

  await writeFile(OUTPUT, JSON.stringify(data, null, 2) + "\n");
  console.log(`tasks: ${total} open tasks for ${Object.keys(data).length} project pages → data/tasks.json`);
}

main().catch((err) => {
  const fallback = existsSync(OUTPUT) ? "keeping the existing data/tasks.json" : "project pages will show no tasks";
  console.warn(`tasks: could not refresh from OpenProject (${err.message}); ${fallback}`);
});
