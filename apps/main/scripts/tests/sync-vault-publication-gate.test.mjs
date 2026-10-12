import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(TEST_DIR, "../..");
const REPO_ROOT = path.resolve(APP_ROOT, "../..");
const NODE_MODULES = path.join(REPO_ROOT, "node_modules");
const REGISTER_TS_NODE = path.join(APP_ROOT, "scripts", "register-ts-node.mjs");
const SYNC_VAULT = path.join(APP_ROOT, "scripts", "sync-vault.ts");
const SEND_NEWSLETTER = path.join(APP_ROOT, "scripts", "send-newsletter.ts");

const cleanupRoots = new Set();

test.after(async () => {
  await Promise.all(
    [...cleanupRoots].map((root) => rm(root, { recursive: true, force: true }))
  );
});

function renderSource(file) {
  const frontmatter = [
    "---",
    `title: ${file.title ?? "Fixture"}`,
    `slug: ${file.slug}`,
    "date: 2026-09-27",
    ...(file.type ? [`type: ${file.type}`] : []),
    ...(file.published === undefined
      ? []
      : [`published: ${String(file.published)}`]),
    "---",
  ].join("\n");
  return `${frontmatter}\n${file.body}\n`;
}

async function makeFixture(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "sync-vault-gate-"));
  cleanupRoots.add(root);

  const vaultRoot = path.join(root, "vault");
  const siteRoot = path.join(root, "site");
  const brandRoot = path.join(vaultRoot, "Brand");

  await Promise.all([
    mkdir(path.join(brandRoot, "Blog"), { recursive: true }),
    mkdir(path.join(brandRoot, "Daily"), { recursive: true }),
    mkdir(path.join(brandRoot, "週報"), { recursive: true }),
    mkdir(path.join(brandRoot, "Config"), { recursive: true }),
    mkdir(siteRoot, { recursive: true }),
  ]);

  // register-ts-node.mjs resolves ts-node from process.cwd(). CI has a normal
  // install here; this symlink keeps each integration fixture self-contained.
  await symlink(NODE_MODULES, path.join(siteRoot, "node_modules"), "dir");

  for (const file of files) {
    await writeFile(
      path.join(brandRoot, file.dir, file.name),
      renderSource(file),
      "utf8"
    );
  }

  return { root, siteRoot, vaultRoot };
}

function runTypeScript(script, fixture, args = []) {
  return spawnSync(
    process.execPath,
    ["--no-deprecation", "--import", REGISTER_TS_NODE, script, ...args],
    {
      cwd: fixture.siteRoot,
      env: {
        ...process.env,
        OBSIDIAN_VAULT_PATH: fixture.vaultRoot,
        TMPDIR: fixture.root,
      },
      encoding: "utf8",
    }
  );
}

function runSync(fixture) {
  return runTypeScript(SYNC_VAULT, fixture);
}

function combinedOutput(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

async function assertPathMissing(target) {
  await assert.rejects(access(target));
}

async function assertSyncRejected(file) {
  const fixture = await makeFixture([file]);
  const result = runSync(fixture);
  const output = combinedOutput(result);
  const source = renderSource(file);
  const hitLine = source
    .split("\n")
    .findIndex((line) => line.includes("%%") || line.includes("【待你補")) + 1;

  assert.notEqual(result.status, 0, output);
  assert.match(output, new RegExp(file.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(output, new RegExp(`${hitLine}: contains`));
  assert.equal(
    await readFile(
      path.join(fixture.vaultRoot, "Brand", file.dir, file.name),
      "utf8"
    ),
    source,
    "gate must not rewrite the source"
  );
  await assertPathMissing(
    path.join(fixture.siteRoot, "content", "blog", `${file.slug}.json`)
  );
}

test("published Blog containing %% rejects the whole sync", async () => {
  await assertSyncRejected({
    dir: "Blog",
    name: "published-percent.md",
    slug: "published-percent",
    published: true,
    body: "%% 提示：請補上想法。 %%",
  });
});

test("published Weekly containing only 【待你補 rejects the whole sync", async () => {
  await assertSyncRejected({
    dir: "週報",
    name: "published-bracket.md",
    slug: "published-bracket",
    type: "weekly",
    published: true,
    body: "【待你補",
  });
});

test("missing published field in Daily still rejects %%", async () => {
  await assertSyncRejected({
    dir: "Daily",
    name: "implicit-percent.md",
    slug: "implicit-percent",
    body: "正文前。\n%%",
  });
});

test("missing published field still rejects only 【待你補", async () => {
  await assertSyncRejected({
    dir: "Blog",
    name: "implicit-bracket.md",
    slug: "implicit-bracket",
    body: "【待你補",
  });
});

test("mapped public Config body is covered by the gate", async () => {
  await assertSyncRejected({
    dir: "Config",
    name: "About.md",
    slug: "about",
    body: "公開介紹。\n%% 提示：補一句。 %%",
  });
});

test("preflight prevents clean files from being written when any eligible file is blocked", async () => {
  const fixture = await makeFixture([
    {
      dir: "Blog",
      name: "a-clean.md",
      slug: "a-clean",
      published: true,
      body: "乾淨正文。",
    },
    {
      dir: "週報",
      name: "z-blocked.md",
      slug: "z-blocked",
      type: "weekly",
      published: true,
      body: "%%",
    },
  ]);

  const result = runSync(fixture);
  assert.notEqual(result.status, 0, combinedOutput(result));
  await assertPathMissing(
    path.join(fixture.siteRoot, "content", "blog", "a-clean.json")
  );
});

test("published false files are outside the gate and clean files sync", async () => {
  const fixture = await makeFixture([
    {
      dir: "Blog",
      name: "unpublished.md",
      slug: "unpublished",
      published: false,
      body: "%%\n【待你補",
    },
    {
      dir: "週報",
      name: "clean-weekly.md",
      slug: "clean-weekly",
      type: "weekly",
      published: true,
      body: "乾淨正文。",
    },
  ]);

  const result = runSync(fixture);
  assert.equal(result.status, 0, combinedOutput(result));
  await assertPathMissing(
    path.join(fixture.siteRoot, "content", "blog", "unpublished.json")
  );
  const synced = JSON.parse(
    await readFile(
      path.join(fixture.siteRoot, "content", "blog", "clean-weekly.json"),
      "utf8"
    )
  );
  assert.equal(synced.slug, "clean-weekly");
  assert.equal(synced.content, "乾淨正文。");

  // Newsletter must consume the exact JSON produced by sync-vault.
  const newsletter = runTypeScript(SEND_NEWSLETTER, fixture, [
    "clean-weekly",
    "--preview",
  ]);
  assert.equal(newsletter.status, 0, combinedOutput(newsletter));
  assert.match(combinedOutput(newsletter), /subject: Fixture/);
});

// Weekly #028 (2026-10-12) shipped drafting leftovers that are not %% hints.
function weekly(name, body) {
  return {
    dir: "週報",
    name: `${name}.md`,
    slug: name,
    type: "weekly",
    published: true,
    body,
  };
}

async function assertLeftoverRejected(body, expected) {
  const fixture = await makeFixture([weekly("self-note", body)]);
  const result = runSync(fixture);
  const output = combinedOutput(result);
  assert.notEqual(result.status, 0, output);
  assert.match(output, expected);
  await assertPathMissing(
    path.join(fixture.siteRoot, "content", "blog", "self-note.json")
  );
}

const REJECTED_LEFTOVERS = [
  [
    "note-to-self quoting the Vault (#028)",
    "每個外科醫師內心都有一個墓園（我記得有一個法國的名言 我有記在vault想引用）我想這個病人的墓碑會在那裡很久。",
    /looks like a note-to-self in parentheses/,
  ],
  [
    "attach-image placeholder (#028)",
    "（附上clamshell的圖片）",
    /looks like a note-to-self in parentheses/,
  ],
  [
    "standalone diagram placeholder (#028)",
    "正文。\n\n（TBE示意圖）\n",
    /looks like an image placeholder/,
  ],
  [
    "broken nested list marker (#028)",
    "- **Cộng cà phê**\n\t- - **Stress mama**（District 2）",
    /looks like a broken list marker/,
  ],
  ["ASCII parentheses", "數字還沒對 (之後補)", /note-to-self in parentheses/],
  [
    "note-to-self split across a line break (Astra review)",
    "每個外科醫師內心都有一個墓園（我記得有一個法國的名言\n我有記在vault想引用）我想這個病人的墓碑會在那裡很久。",
    /note-to-self in parentheses/,
  ],
  [
    "TODO in the title of a link labelled with its URL (Astra round 3)",
    '[https://example.com](https://example.com "TODO: 補標題")',
    /looks like a TODO marker/,
  ],
  [
    "TODO in a link label that only starts with a URL (Astra round 3)",
    "[https://example.com TODO: 補標題](./report.md)",
    /looks like a TODO marker/,
  ],
  [
    "TODO in image alt text (Astra round 3)",
    "![TODO: 補圖說](./image.png)",
    /looks like a TODO marker/,
  ],
  [
    "placeholder line inside a paragraph (Astra round 3)",
    "正文。\n（TBE示意圖）\n下一段。",
    /looks like an image placeholder/,
  ],
  [
    "placeholder right under an Obsidian embed (Fable round 3)",
    "![[x.jpg]]\n（示意圖）",
    /looks like an image placeholder/,
  ],
  [
    "TODO after mismatched backtick runs (Astra re-review)",
    "正文 ``a`b`` TODO: 補結尾 `c`",
    /looks like a TODO marker/,
  ],
  [
    "note with nested parentheses (Astra re-review)",
    "引言（之後補引用（法國名言））",
    /note-to-self in parentheses/,
  ],
  [
    "TODO in a public link title (Astra re-review)",
    '[查看](./report.md "TODO: 補標題")',
    /looks like a TODO marker/,
  ],
  [
    "one-line triple-backtick code is not a fence (Astra review)",
    "```example```\nTODO: 補結尾\n```example```",
    /looks like a TODO marker/,
  ],
  ["fill-in-later note", "他恢復得不錯（之後補）。", /note-to-self in parentheses/],
  ["TODO outside code", "TODO: 補結尾", /looks like a TODO marker/],
  [
    "unclosed fence hiding a later note",
    "```\ncode\n```\n正文。\n```\n（附上clamshell的圖片）",
    /code fence "```" is never closed/,
  ],
  [
    "a tilde line does not close a backtick fence",
    "```\ncode\n~~~\n正文。",
    /code fence "```" is never closed/,
  ],
];

for (const [name, body, expected] of REJECTED_LEFTOVERS) {
  test(`drafting leftover rejects the sync: ${name}`, async () => {
    await assertLeftoverRejected(body, expected);
  });
}

test("frontmatter of a public Config file is checked (Astra round 3)", async () => {
  const fixture = await makeFixture([
    { dir: "Config", name: "About.md", slug: "about", title: "TODO 補頁尾", body: "公開介紹。" },
  ]);
  const result = runSync(fixture);
  assert.notEqual(result.status, 0, combinedOutput(result));
  assert.match(combinedOutput(result), /looks like a TODO marker/);
});

test("ordinary prose, credits, lists, breaks and closed fences pass", async () => {
  const fixture = await makeFixture([
    weekly(
      "clean-prose",
      [
        "我記得那天下雨（其實是陰天）。",
        "（第三支指的是左鎖骨下動脈。）",
        "（圖：Wikimedia Commons）",
        "*Clamshell 切口示意。圖：Stockholm，Wikimedia Commons*",
        "引用自（Jiri Vault, 1998）。",
        "（兩週後再查心臟超音波）",
        "（等待補助終於有了結果）",
        "[查看](https://github.com/example/project/blob/main/TODO.md)",
        "見 https://example.com/TODO 與 `TODO` 程式碼。",
        "手術時間 TBD。",
        "- [ ] 待辦清單項目",
        "- - -",
        "* * *",
        "```",
        "- - TODO inside code",
        "```",
        "~~~~",
        "（附上圖片）inside a tilde fence",
        "```",
        "~~~~",
      ].join("\n")
    ),
  ]);
  const result = runSync(fixture);
  assert.equal(result.status, 0, combinedOutput(result));
});
