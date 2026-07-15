# Personal Knowledge Base Creator (v1.2.0)

A template for building an **AI-maintained personal knowledge base**, based on [Andrej Karpathy's LLM Wiki pattern](https://x.com/karpathy/status/2039805659525644595). Drop source files into a `raw/` folder; your AI assistant (Cursor, Claude Code, or VS Code/Copilot) turns them into a structured, cross-linked wiki of plain Markdown files — and keeps compounding knowledge as you add more.

## What You Get

### From Karpathy's pattern

- **Plain Markdown, no external tooling** — no vector databases, no embeddings servers, no extra API keys; the `wiki/` folder is just files you can open in any editor
- **Uses your existing LLM** — everything runs through your Cursor, Claude Code, or VS Code/Copilot subscription; nothing extra to sign up for or pay for
- **Compounding knowledge** — the AI reads *across* your notes, extracts concepts, and connects them into a growing graph; the more you add, the richer the connections

### What this implementation adds

- **Automatic wiki derivation** — add files to `raw/`, note your topics in `AGENTS.md`, run `/compile-wiki`; the agent extracts summaries, identifies relations between concepts, and builds the cross-linked graph — no manual prompting or curation required
- **Agentic graph retrieval** — `/ask-wiki` instructs the agent to traverse the `[[wiki-links]]` graph rather than loading all sources at once: it reads a compact index first, then follows links to only the pages it needs; informal trials showed roughly **50–90% fewer tokens** compared to querying raw files directly (results vary with corpus size and topic overlap¹)
- **Global and local scope** — a global install makes your wiki accessible from any project on your machine; a local install scopes a separate wiki to a single repo; particularly useful for pulling accumulated domain knowledge into new projects without duplicating files
- **Easy setup** — `setup.sh` / `setup.ps1` symlinks the three skills into your IDE's skill directory in one command; alternatively, copy the `SKILL.md` files manually if you prefer
- **Obsidian-ready** — an optional vault config is included for graph view and backlinks; any Markdown editor works without it
- **Open Knowledge Format (OKF) aligned** — the wiki natively conforms to Google's [Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing); `node export_okf.js` emits a portable OKF bundle for external tooling (e.g. Google's Knowledge Catalog and its graph visualizer) without touching your native vault — see [Open Knowledge Format (OKF)](#open-knowledge-format-okf) below

> ¹ Informal trials on a real personal KB, not a formal RAG evaluation. Results will vary with corpus size, source density, and topic overlap. A proper evaluation (precision/recall, RAG benchmarks) could be added later — contributions welcome.

## How It Works

```
raw/          ← you drop source files here (papers, articles, notes, PDFs)
  │
  └─ /compile-wiki  (AI skill)
        │
        ▼
wiki/         ← AI builds and maintains this (plain Markdown)
  │
  ├─ /ask-wiki    → query your knowledge base, get reports saved to output/
  └─ /lint-wiki   → monthly health check: fix links, merge duplicates, suggest gaps

output/       ← generated briefings and reports (gitignored, stays local)
```

Each time you run `/compile-wiki`, the AI reads only the **unprocessed** files in `raw/`, extracts concepts, creates or updates topic pages in `wiki/`, links them with `[[wiki-links]]`, and updates the index and log. Knowledge compounds with every pass.

## Quick Start

### 1. Clone and set up

**macOS / Linux** (also Git Bash or WSL on Windows):

```bash
git clone git@github.com:jlbgit/PersonalKnowledgeBaseCreator.git MyKnowledgeBase
cd MyKnowledgeBase
chmod +x setup.sh
./setup.sh cursor                # Cursor: global scope (default)
./setup.sh cursor global         # explicit global — same as above
./setup.sh claude global         # Claude Code
./setup.sh copilot global        # VS Code / GitHub Copilot
./setup.sh cursor claude global  # multiple platforms at once
```

**Windows (PowerShell)**:

```powershell
git clone git@github.com:jlbgit/PersonalKnowledgeBaseCreator.git MyKnowledgeBase
cd MyKnowledgeBase
.\setup.ps1 cursor
.\setup.ps1 cursor global
.\setup.ps1 cursor, claude global
```

**Scopes:** `global` (default) installs skills and writes `wiki-config.md` next to those skills (e.g. `~/.cursor/skills/wiki-config.md`) so paths point at this clone — use `/ask-wiki` and `/compile-wiki` from **any** open project. `local` scaffolds a wiki in the **current directory** (see [Project-local wikis](#project-local-wikis) below).

> **Windows note:** Symlinks require Developer Mode (`Settings > System > For developers`). The script falls back to copying files if unavailable — just re-run it after `git pull` to update.

> **Backing up your wiki:** The setup script automatically disconnects your clone from the template repository. Your `raw/` files, `output/` reports, and generated wiki pages are all gitignored. To back up your knowledge base, add your own remote: `git remote add origin <your-repo-url>`.

### 2. Personalize

Open `AGENTS.md` and replace the placeholder entries in the **"My Interests / Focus Areas"** section with your own topics. This tells the AI how to cluster and link concepts as it builds your wiki.

### 3. Add your first sources

Drop any `.md`, `.pdf`, or `.txt` files into the `raw/` folder.

### 4. Compile the wiki

Open the repo in your AI assistant and say:

> *"Compile the wiki"* — or use the slash command `/compile-wiki`

### 5. Explore your wiki

**a) Query it in your IDE**

Ask questions using `/ask-wiki`. The skill uses *agentic graph retrieval*: it reads `index.md` first to get a compact map of all topics, then follows `[[wiki-links]]` to load only the pages relevant to your question — the full wiki never needs to fit in context at once. Some questions to try (swap in your own topics):

> *"Summarize the main approaches to building energy optimization I've collected. What gaps am I missing?"*

> *"How do multi-agent LLM systems relate to the agentic AI patterns I've been reading about?"*

> *"Which papers or sources connect Model Predictive Control to machine learning methods?"*

> *"Give me a research briefing on token optimization techniques across all my notes."*

> *"What do I know about confounding bias and causal inference? How does it connect to double machine learning?"*

Each query saves a report to `output/` and feeds new insights back into the wiki — so the knowledge base keeps compounding.

**b) Visualize the graph in Obsidian (optional)**

Open the `wiki/` folder as a vault in [Obsidian](https://obsidian.md) to browse the knowledge graph visually. Node colors represent topic clusters; edges are the `[[wiki-links]]` the AI built. Any other Markdown editor works too — Obsidian is not required.

![Example knowledge graph](example/example_knowledge_graph.png)

## Using your wiki from other projects

After `./setup.sh cursor global` (or `claude` / `copilot`), the skills read **`wiki-config.md`** next to the installed skills. It stores absolute paths to **Wiki root**, **Wiki folder**, **Raw folder**, and **Output folder** for this clone. Open any other repository in Cursor (or your assistant) and run `/ask-wiki` or `/compile-wiki` — the agent resolves your global wiki without that repo containing a `wiki/` folder.

## Project-local wikis

To keep a **separate** wiki inside another project (e.g. one codebase = one wiki), `cd` into that project and run the setup script **from your clone** of this template:

```bash
cd /path/to/YourOtherProject
/path/to/PersonalKnowledgeBaseCreator/setup.sh cursor local
```

This symlinks the skills (if needed) and creates in **that** directory: `raw/`, `output/`, `wiki/` (with starter `index.md`, `log.md`, and `.obsidian/`), `AGENTS.md`, `lint_graph.js` (so `/lint-wiki` can run with cwd set to this folder), `export_okf.js` (so `node export_okf.js` can produce an OKF bundle from this folder), and a **`wiki-config.md` in the project root**.

**Precedence:** if the open workspace contains `wiki-config.md` at its root, the skills use that (**local**) and ignore the global file next to the skills. Remove or rename the local file to fall back to global.

## The Three Skills

| Skill | Trigger | What it does |
|---|---|---|
| `compile-wiki` | `/compile-wiki` | Processes new `raw/` files → creates/updates wiki pages → updates index and log |
| `ask-wiki` | `/ask-wiki` | Answers questions via agentic graph retrieval (reads index → follows `[[wiki-links]]` to relevant pages only) → saves report to `output/` → re-integrates insights |
| `lint-wiki` | `/lint-wiki` | Health check: frontmatter validation, dangling links, orphan pages, duplicate topics, index sync, contradiction detection, new topic suggestions |

## Open Knowledge Format (OKF)

The wiki is compatible with Google's **[Open Knowledge Format (OKF)](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)** ([SPEC.md v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)) — a portable markdown-plus-YAML standard for sharing knowledge bundles with external tooling such as Google's Knowledge Catalog and its HTML graph visualizer.

Conformance is **native**: OKF's only required field is a non-empty `type:` on every page, which this wiki already enforces, and its frontmatter maps directly onto OKF's recommended fields (`url` → `resource`, `date_added` → `timestamp`, plus optional `description`). The only difference is linking — the native vault uses Obsidian `[[wiki-links]]` (for graph view and agentic retrieval), whereas OKF consumers read standard markdown links.

### Exporting a portable OKF bundle

`export_okf.js` is a zero-dependency Node script (like `lint_graph.js` — no `npm install`, no config). It reads `wiki/` and writes a derived OKF bundle to `output/okf/`, **without modifying your native vault**. From the repo root:

```bash
node export_okf.js
```

It prints a short report, e.g.:

```
=== OKF Export (v0.1) ===
Bundle: output/okf/
Pages exported: 68   Links rewritten: 135

SKIPPED (not OKF-conformant, left out of bundle)
  (none — all pages exported)

UNRESOLVED [[links]] (rendered as plain text)
  (none — all links resolved)
```

For each page it: rewrites `[[wiki-links]]` (and `[[Target|Alias]]`) into bundle-relative markdown links like `[Model Context Protocol](/Agentic%20AI/Model%20Context%20Protocol.md)`; adds the OKF `resource`/`timestamp` aliases alongside your existing frontmatter; and generates a navigable `output/okf/index.md` (declaring `okf_version: "0.1"`) plus a copy of `log.md`. Links inside inline code (`` `[[like-this]]` ``) and any page missing a `type:` are deliberately skipped and reported.

**Notes on using it:**
- **Re-run any time** — the bundle is a build artifact; each run cleans and regenerates `output/okf/`, so run it again after `/compile-wiki` to refresh.
- **Stays local** — `output/` is gitignored, so the bundle is never committed; regenerate it wherever you need it.
- **Consume it** — point OKF-aware tooling (e.g. Google's Knowledge Catalog or the reference HTML graph visualizer in [knowledge-catalog/okf](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf)) at `output/okf/`, or share the folder as a self-contained bundle.

See the **Open Knowledge Format (OKF)** section in `AGENTS.md` for the full field mapping.

**References:**
- [How the Open Knowledge Format can improve data sharing](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) — Google Cloud announcement
- [OKF specification (SPEC.md v0.1)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) — the format definition
- [knowledge-catalog/okf](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) — reference implementation, samples, and HTML visualizer

## Scale & Practical Limits

> **TL;DR:** This pattern works best with **~100 raw sources** producing **~hundreds of wiki pages** — roughly 400,000 words of compiled knowledge. Modern LLMs on the Cursor plan handle this comfortably. Beyond ~300 sources the index starts getting heavy; at 500+ you should consider batching or adding a search layer.

These numbers come directly from Karpathy's original gist — *"this works surprisingly well at moderate scale (~100 sources, ~hundreds of pages)"* — and are validated by secondary analyses that estimate the resulting wiki at roughly **400,000 words** (~500,000–550,000 tokens at ~1.3 tokens per word).

### Why the pattern doesn't need everything in one context window

The skills use *agentic graph retrieval*: at query or lint time the agent reads `index.md` (a compact catalog of all pages) and then follows `[[wiki-links]]` to load only the specific pages it needs. The full wiki never has to fit in context at once — only the index plus a handful of relevant pages do. This is why 400,000 words of accumulated knowledge is achievable even on models with 200K-token windows.

### Practical limits for Cursor plan LLMs (Sonnet, Opus, GPT-5.4, Kimi, Composer…)

| Dimension | Sweet spot | Soft ceiling | What degrades |
|---|---|---|---|
| **Files per `/compile-wiki` run** | 5–15 files | ~20–30 files | Response quality and accuracy drop as the agent juggles too many new sources at once |
| **Total sources in `raw/`** (accumulated over time) | ~100 | ~200–300 | `index.md` grows large and slow to scan |
| **Single file size** | < 30,000 words (~40K tokens) | < 50,000 words (~65K tokens) | Larger files may not leave enough context for the skill instructions + wiki index |
| **Total wiki pages** | ~100–200 pages | ~300–400 pages | `index.md` starts consuming significant context, leaving less room for reasoning |

> **Individual file sizes:** Research papers (5,000–15,000 words) and web articles work perfectly. If you drop in a book, thesis, or large report, split it into chapters or sections first — anything over ~50,000 words in a single file risks crowding out the context window during compilation.

> **Batch your drops:** Rather than adding 50 files at once, add 10–20 at a time and run `/compile-wiki` between batches. The skill is designed for incremental ingestion — it tracks what has already been processed in `log.md`.

### When to consider adding search

If your wiki grows past ~300 pages and `/ask-wiki` queries feel slow or imprecise, it may be time to add a lightweight search layer (e.g. [qmd](https://github.com/tobi/qmd), which Karpathy recommends) rather than migrating to a full RAG pipeline. The underlying Markdown files stay the same — you're just adding a tool that lets the LLM pre-filter which pages to load.

## Folder Structure

```
PersonalKnowledgeBaseCreator/
├── AGENTS.md              ← AI instruction file (edit your focus areas here)
├── README.md              ← this file
├── LICENSE
├── .gitignore             ← raw/, output/, and user wiki content stay local
├── setup.sh               ← macOS/Linux installer (global | local)
├── setup.ps1              ← Windows installer (global | local)
├── lint_graph.js          ← zero-dependency graph linter (Node.js)
├── export_okf.js          ← zero-dependency Open Knowledge Format exporter → output/okf/
├── raw/                   ← drop source files here (gitignored, stays local)
├── output/                ← generated reports land here (gitignored, stays local)
├── skills/
│   ├── compile-wiki/SKILL.md
│   ├── ask-wiki/SKILL.md
│   └── lint-wiki/SKILL.md
└── wiki/                  ← AI-maintained wiki (plain Markdown)
    ├── index.md           ← master topic index
    ├── log.md             ← processing audit trail
    └── .obsidian/         ← optional Obsidian vault config (graph view, backlinks)

# After setup (not in this repo — paths depend on your machine):

~/.cursor/skills/          ← symlinks to skills/ + wiki-config.md (global install)
YourOtherProject/          ← optional: wiki-config.md at repo root (local install)
```

## Uninstalling

```bash
./setup.sh --uninstall cursor
# or
.\setup.ps1 -Uninstall cursor
```

This removes the skill symlinks (or copies) and the **global** `wiki-config.md` next to them. Your wiki clone and any **local** `wiki-config.md` inside other projects are untouched — delete a local `wiki-config.md` yourself if you no longer want that project to override the global wiki.

## Credits

This pattern is based on the **LLM Wiki** approach originally proposed by [Andrej Karpathy](https://x.com/karpathy/status/2039805659525644595). The core idea: use an LLM not as a search engine, but as a librarian that maintains a structured, growing knowledge graph from your raw inputs.

The implementation in this repository was also inspired by the work of [Nick Spisak](https://x.com/NickSpisak_/status/2040448463540830705) and the comprehensive [LLM Wiki tutorial by Data Science Dojo](https://datasciencedojo.com/blog/llm-wiki-tutorial/).

## License

MIT — see [LICENSE](LICENSE).

## Disclaimer

Please review the [DISCLAIMER.md](DISCLAIMER.md) file for important legal information regarding the use of this experimental software.

> *tested on Cursor only as of April 2026