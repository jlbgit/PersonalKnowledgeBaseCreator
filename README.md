# Personal Knowledge Base Creator (v1.0.0)

A template for building your own **compounding, AI-maintained personal knowledge base** — inspired by [Andrej Karpathy's LLM Wiki pattern](https://x.com/karpathy/status/2039805659525644595). Drop in raw notes, papers, or articles and let your AI assistant (Cursor, Claude Code, or VS Code/Copilot) transform them into a structured, interlinked wiki you can explore visually in [Obsidian](https://obsidian.md).

## What You Get

- **3 AI skills** — `compile-wiki`, `ask-wiki`, and `lint-wiki` — that run directly inside your IDE
- **One-command setup** — a single script that symlinks the skills into your AI platform's directory
- **Zero external dependencies** — plain Markdown files, no databases, no vector stores, no servers
- **Obsidian-ready** — the `wiki/` folder is a pre-configured vault with graph view, backlinks, and tag pane
- **Cross-platform** — works on macOS, Linux, and Windows; supports Cursor, Claude Code, and GitHub Copilot

## How It Works

```
raw/          ← you drop source files here (papers, articles, notes, PDFs)
  │
  └─ /compile-wiki  (AI skill)
        │
        ▼
wiki/         ← AI builds and maintains this (Obsidian vault)
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
./setup.sh cursor          # for Cursor IDE
./setup.sh claude          # for Claude Code
./setup.sh copilot         # for VS Code / GitHub Copilot
./setup.sh cursor claude   # multiple platforms at once
```

**Windows (PowerShell)**:

```powershell
git clone git@github.com:jlbgit/PersonalKnowledgeBaseCreator.git MyKnowledgeBase
cd MyKnowledgeBase
.\setup.ps1 cursor
.\setup.ps1 cursor, claude   # multiple platforms at once
```

> **Windows note:** Symlinks require Developer Mode (`Settings > System > For developers`). The script falls back to copying files if unavailable — just re-run it after `git pull` to update.

> **Your data stays private.** The setup script automatically disconnects your clone from the template repository so you can't accidentally push personal content back. Your `raw/` files, `output/` reports, and any wiki pages you generate are all gitignored. To back up your knowledge base, add your own remote: `git remote add origin <your-repo-url>`.

### 2. Personalize

Open `AGENTS.md` and replace the placeholder entries in the **"My Interests / Focus Areas"** section with your own topics. This tells the AI how to cluster and link concepts as it builds your wiki.

### 3. Add your first sources

Drop any `.md`, `.pdf`, or `.txt` files into the `raw/` folder.

### 4. Compile the wiki

Open the repo in your AI assistant and say:

> *"Compile the wiki"* — or use the slash command `/compile-wiki`

### 5. Browse in Obsidian

Open the `wiki/` folder as an **Obsidian vault**. Use the Graph view to explore your knowledge network.

## The Three Skills

| Skill | Trigger | What it does |
|---|---|---|
| `compile-wiki` | `/compile-wiki` | Processes new `raw/` files → creates/updates wiki pages → updates index and log |
| `ask-wiki` | `/ask-wiki` | Answers questions using only your wiki → saves report to `output/` → re-integrates insights |
| `lint-wiki` | `/lint-wiki` | Health check: dangling links, orphan pages, duplicate topics, index sync, new topic suggestions |

## Folder Structure

```
PersonalKnowledgeBaseCreator/
├── AGENTS.md              ← AI instruction file (edit your focus areas here)
├── README.md              ← this file
├── LICENSE
├── .gitignore             ← raw/, output/, and user wiki content stay local
├── setup.sh               ← macOS/Linux installer
├── setup.ps1              ← Windows installer
├── lint_graph.js          ← zero-dependency graph linter (Node.js)
├── raw/                   ← drop source files here (gitignored, stays local)
├── output/                ← generated reports land here (gitignored, stays local)
├── skills/
│   ├── compile-wiki/SKILL.md
│   ├── ask-wiki/SKILL.md
│   └── lint-wiki/SKILL.md
└── wiki/                  ← Obsidian vault (AI-maintained)
    ├── index.md           ← master topic index
    ├── log.md             ← processing audit trail
    └── .obsidian/         ← pre-configured vault settings
```

## Examples

Once your wiki is populated, `/ask-wiki` lets you query across everything you've read. Here are some questions to try — swap in your own topics:

> *"Summarize the main approaches to building energy optimization I've collected. What gaps am I missing?"*

> *"How do multi-agent LLM systems relate to the agentic AI patterns I've been reading about?"*

> *"Which papers or sources connect Model Predictive Control to machine learning methods?"*

> *"Give me a research briefing on token optimization techniques across all my notes."*

> *"What do I know about confounding bias and causal inference? How does it connect to double machine learning?"*

Each query saves a report to `output/` and feeds new insights back into the wiki — so the knowledge base keeps compounding.

The graph below shows an example knowledge graph in Obsidian (you can also use other tools). Node colors represent topic clusters; edges are `[[wiki-links]]` extracted by the AI.

![Example knowledge graph](example/example_knowledge_graph.png)

## Uninstalling

```bash
./setup.sh --uninstall cursor
# or
.\setup.ps1 -Uninstall cursor
```

This removes only the symlinks from your platform's skill directory. Your wiki and data are untouched.

## Credits

This pattern is based on the **LLM Wiki** approach originally proposed by [Andrej Karpathy](https://x.com/karpathy/status/2039805659525644595). The core idea: use an LLM not as a search engine, but as a librarian that maintains a structured, growing knowledge graph from your raw inputs.

The implementation in this repository was also inspired by the work of [Nick Spisak](https://x.com/NickSpisak_/status/2040448463540830705) and the comprehensive [LLM Wiki tutorial by Data Science Dojo](https://datasciencedojo.com/blog/llm-wiki-tutorial/).

## License

MIT — see [LICENSE](LICENSE).

## Disclaimer

Please review the [DISCLAIMER.md](DISCLAIMER.md) file for important legal information regarding the use of this experimental software.

> *tested on Cursor only as of April 2026