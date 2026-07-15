#!/usr/bin/env node
// Derives a portable Open Knowledge Format (OKF v0.1) bundle from the native wiki/.
// Non-destructive: reads wiki/, writes only output/okf/. The native vault (with its
// [[wiki-links]] and Obsidian config) is never modified. Zero dependencies — mirrors
// lint_graph.js. Spec: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
const fs = require('fs');
const path = require('path');

const wikiDir = path.join(__dirname, 'wiki');
const outDir = path.join(__dirname, 'output', 'okf');
const OKF_VERSION = '0.1';

// --- Helpers (shared style with lint_graph.js) ---

function walkMd(dir) {
  return fs.readdirSync(dir, { recursive: true })
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\\/g, '/'));
}

// Splits a document into [yaml, body]; returns null if there is no closed frontmatter.
function splitFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { yaml: m[1], body: m[2] } : null;
}

function fieldValue(yaml, key) {
  const m = yaml.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'mi'));
  return m ? m[1].trim() : null;
}

// Bundle-relative link target (leading '/'), URI-encoded so spaces are valid markdown.
function bundleLink(relPath) {
  return encodeURI('/' + relPath);
}

// --- 1. Discover pages and build the name -> bundle-path map ---

const allFiles = walkMd(wikiDir);
const topicFiles = allFiles.filter(f => f !== 'log.md' && f !== 'index.md');

const pathMap = new Map(); // basename (no .md) -> bundle-relative path
for (const file of topicFiles) {
  pathMap.set(path.basename(file, '.md'), file);
}

// --- 2. Rewrite [[wiki-links]] -> bundle-relative markdown links ---

const unresolved = new Set();
let linkCount = 0;

function rewriteLinks(text) {
  // Same backtick-aware matcher as lint_graph.js; handles [[Target]], [[Target|Alias]]
  // and Obsidian [[Target#Section]] anchors.
  return text.replace(/(?<!`)\[\[(.*?)\]\](?!`)/g, (_full, inner) => {
    const [linkPart, alias] = inner.split('|');
    const targetName = linkPart.split('#')[0].trim();
    const display = (alias !== undefined ? alias : linkPart).trim();
    const target = pathMap.get(targetName);
    if (!target) {
      unresolved.add(targetName); // OKF tolerates missing links: fall back to plain text
      return display;
    }
    linkCount++;
    return `[${display}](${bundleLink(target)})`;
  });
}

// --- 3. Clean and recreate the derived bundle (build artifact, owns output/okf only) ---

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

function writeOut(relPath, content) {
  const dest = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

// --- 4. Export each topic page ---

const skipped = [];
let exported = 0;

for (const file of topicFiles) {
  const content = fs.readFileSync(path.join(wikiDir, file), 'utf8');
  const parsed = splitFrontmatter(content);

  // OKF requires a closed frontmatter block with a non-empty `type`.
  if (!parsed) { skipped.push(`${file} (no frontmatter)`); continue; }
  const type = fieldValue(parsed.yaml, 'type');
  if (!type) { skipped.push(`${file} (empty/missing type)`); continue; }

  // Add OKF-recommended aliases in the derived copy only (originals preserved).
  let extra = '';
  const url = fieldValue(parsed.yaml, 'url');
  if (url && !fieldValue(parsed.yaml, 'resource')) extra += `resource: ${url}\n`;
  const dateAdded = fieldValue(parsed.yaml, 'date_added');
  if (dateAdded && !fieldValue(parsed.yaml, 'timestamp')) extra += `timestamp: ${dateAdded}\n`;

  const yaml = parsed.yaml.replace(/\n+$/, '');
  const rebuiltFm = `---\n${yaml}\n${extra}---\n`;
  writeOut(file, rebuiltFm + rewriteLinks(parsed.body));
  exported++;
}

// --- 5. Reserved files: linkified OKF index + copied log ---

const indexPath = path.join(wikiDir, 'index.md');
if (fs.existsSync(indexPath)) {
  const raw = fs.readFileSync(indexPath, 'utf8');
  const parsed = splitFrontmatter(raw);
  let yaml = parsed ? parsed.yaml : '';
  let body = parsed ? parsed.body : raw;
  if (!/^\s*okf_version:/mi.test(yaml)) {
    yaml = (yaml ? yaml.replace(/\n+$/, '') + '\n' : '') + `okf_version: "${OKF_VERSION}"`;
  }
  // Linkify "- Name: desc" bullets to OKF's title + relative-link + description form.
  const linkedBody = body.replace(/^(\s*)- (.+?): (.*)$/gm, (full, indent, name, desc) => {
    const target = pathMap.get(name.trim());
    return target ? `${indent}- [${name}](${bundleLink(target)}): ${desc}` : full;
  });
  writeOut('index.md', `---\n${yaml.replace(/\n+$/, '')}\n---\n${linkedBody}`);
}

const logPath = path.join(wikiDir, 'log.md');
if (fs.existsSync(logPath)) {
  writeOut('log.md', fs.readFileSync(logPath, 'utf8'));
}

// --- 6. Report (lint_graph.js style) ---

function section(title, items, emptyMsg) {
  console.log(`\n${title}`);
  if (items.length === 0) { console.log(`  (none — ${emptyMsg})`); return; }
  items.forEach(i => console.log(`  - ${i}`));
}

console.log(`=== OKF Export (v${OKF_VERSION}) ===`);
console.log(`Bundle: ${path.relative(__dirname, outDir)}/`);
console.log(`Pages exported: ${exported}   Links rewritten: ${linkCount}`);
section('SKIPPED (not OKF-conformant, left out of bundle)', skipped, 'all pages exported');
section('UNRESOLVED [[links]] (rendered as plain text)', [...unresolved], 'all links resolved');
console.log('\n=== Done ===');
