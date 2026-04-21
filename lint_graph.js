#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const wikiDir = path.join(__dirname, 'wiki');

// --- Helpers ---

function walkMd(dir) {
  return fs.readdirSync(dir, { recursive: true })
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\\/g, '/'));
}

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).sort().join(' ');
}

/** True if s is YYYY-MM-DD and a valid calendar date (UTC). */
function isValidISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// --- 1. Discover pages ---

const allFiles = walkMd(wikiDir);
const topicFiles = allFiles.filter(f => f !== 'log.md' && f !== 'index.md');

const pages = new Map();
for (const file of topicFiles) {
  const name = path.basename(file, '.md');
  pages.set(name, { file, incoming: new Set(), outgoing: new Set() });
}

// --- 2. Parse links and frontmatter ---

const frontmatterIssues = [];

for (const [name, data] of pages.entries()) {
  const content = fs.readFileSync(path.join(wikiDir, data.file), 'utf8');

  // Frontmatter validation
  if (!content.startsWith('---')) {
    frontmatterIssues.push(`${data.file}: missing frontmatter block`);
  } else {
    const fmEnd = content.indexOf('---', 3);
    if (fmEnd === -1) {
      frontmatterIssues.push(`${data.file}: unclosed frontmatter block`);
    } else {
      const fm = content.slice(3, fmEnd);
      if (!/authors:/i.test(fm))
        frontmatterIssues.push(`${data.file}: missing 'authors:' in frontmatter`);
      if (!/tags:/i.test(fm))
        frontmatterIssues.push(`${data.file}: missing 'tags:' in frontmatter`);
      if (!/date_added:/i.test(fm)) {
        frontmatterIssues.push(`${data.file}: missing 'date_added:' in frontmatter`);
      } else {
        const dateLine = fm.match(/^\s*date_added:\s*(.+)$/mi);
        if (!dateLine) {
          frontmatterIssues.push(`${data.file}: 'date_added:' present but value unreadable`);
        } else {
          const rawVal = dateLine[1].trim().replace(/^["']|["']$/g, '');
          if (!isValidISODate(rawVal)) {
            frontmatterIssues.push(
              `${data.file}: 'date_added:' must be ISO date YYYY-MM-DD (got: ${rawVal || '(empty)'})`
            );
          }
        }
      }
    }
  }

  // Wiki-link extraction
  const linkRegex = /\[\[(.*?)\]\]/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const target = match[1];
    data.outgoing.add(target);
    if (pages.has(target)) {
      pages.get(target).incoming.add(name);
    }
  }
}

// --- 3. Unexplained topics (dangling links) ---

const unexplained = new Set();
for (const [, data] of pages.entries()) {
  for (const target of data.outgoing) {
    if (!pages.has(target)) unexplained.add(target);
  }
}

// --- 4. Orphans (no connections at all) ---

const orphans = [];
for (const [name, data] of pages.entries()) {
  if (data.incoming.size === 0 && data.outgoing.size === 0) orphans.push(name);
}

// --- 5. Index sync ---

const indexPath = path.join(wikiDir, 'index.md');
const indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
const indexTopics = new Set();
for (const line of indexContent.split('\n')) {
  const m = line.match(/^- (.+?):/);
  if (m) indexTopics.add(m[1].trim());
}

const missingFromIndex = [];
const extraInIndex = [];
for (const name of pages.keys()) {
  if (!indexTopics.has(name)) missingFromIndex.push(name);
}
for (const name of indexTopics) {
  if (!pages.has(name)) extraInIndex.push(name);
}

// --- 6. Redundancy detection (normalized name collisions) ---

const normMap = new Map();
for (const name of pages.keys()) {
  const key = normalize(name);
  if (!normMap.has(key)) normMap.set(key, []);
  normMap.get(key).push(name);
}
const possibleDuplicates = [...normMap.values()].filter(v => v.length > 1);

// --- Report ---

function section(title, items, emptyMsg) {
  console.log(`\n${title}`);
  if (items.length === 0) { console.log(`  (none — ${emptyMsg})`); return; }
  items.forEach(i => console.log(`  - ${i}`));
}

console.log(`=== Wiki Lint Report ===`);
console.log(`Total topic pages: ${pages.size}`);

section('UNEXPLAINED TOPICS (dangling [[links]])', [...unexplained], 'all links resolve');
section('ORPHAN PAGES (zero links in or out)', orphans, 'all pages connected');
section('FRONTMATTER ISSUES', frontmatterIssues, 'all pages valid');
section('MISSING FROM index.md', missingFromIndex, 'index is complete');
section('EXTRA IN index.md (no matching file)', extraInIndex, 'index is clean');
section('POSSIBLE DUPLICATES (similar names)',
  possibleDuplicates.map(g => g.join(' ↔ ')), 'no duplicates detected');

console.log('\n=== Done ===');
