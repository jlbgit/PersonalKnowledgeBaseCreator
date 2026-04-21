---
name: compile-wiki
description: Process new raw notes into the organized wiki. Reads new files in raw/, creates/updates entity pages in wiki/ following the schema, adds [[wiki-links]], and updates index.md.
---

# Compile Knowledge Base Wiki

This skill instructs the agent to compile raw notes into the compounding knowledge base wiki, following the exact best practices defined by Andrej Karpathy and the LLM Wiki pattern.

## Instructions

When the user asks you to update the wiki, process new files, or compile the wiki:

0. **Resolve Paths (always do this first):**
   First, check if a `wiki-config.md` exists in the current workspace root
   (this indicates a project-local wiki). If not found, read
   `wiki-config.md` from the same directory as this skill (e.g.,
   `~/.cursor/skills/wiki-config.md`) for the global wiki. The file
   contains four absolute paths labelled **Wiki root**, **Wiki folder**,
   **Raw folder**, and **Output folder**. Use these paths everywhere below
   instead of the relative `wiki/`, `raw/`, and `output/` defaults.
   If neither file exists, fall back to relative paths from the workspace root.

1. **Check for Unprocessed Files:**
   Read `wiki/log.md`. Identify any files in `raw/` that have not yet been logged as processed. Use your native capability to read the text of these files (including PDFs).

1a. **Decide on Batch Size (do this before reading any file content):**
   Count the unprocessed files and estimate load:
   - **Small load (≤ 4 files, all appear short/lightweight):** Process all in one pass — skip to step 2.
   - **Medium load (5–10 files, or any single file is a long PDF/article):** Process in batches of **5 files** per run.
   - **Large load (> 10 files, or multiple long documents):** Process in batches of **4 files** per run.

   When batching:
   - Pick the **oldest unprocessed files first** (by filename or modification date).
   - Process only the current batch (steps 2–4) and fully complete it (wiki pages written, index updated, log appended) before stopping.
   - After finishing the batch, **clearly tell the user** how many files were processed, how many remain, and ask them to run compile-wiki again to continue. Do NOT attempt to process the next batch in the same turn.

2. **Extract Key Concepts:**
   For each new file, extract the core ideas, processes, abstract concepts, and domains (e.g., "building HVAC control", "token minimization"). Focus the primary organization and `[[wiki-links]]` on topics, but do extract and record the author(s) of the source material as plain text (e.g., to include in YAML frontmatter or a "Sources" section; NEVER wrap authors in `[[ ]]` so they don't become nodes in the graph). Also, generate 1-3 broad categorizing `tags` (e.g., `knowledge-management`, `agentic-ai`, `rag`) to include in the YAML frontmatter.
   Capture **source URLs** from the raw material when available (article link, DOI, arXiv, blog URL) for frontmatter `url:` and for clickable links in `## Sources`. Extract **methods** when relevant: technologies, frameworks, tools, lab or experimental techniques (e.g., FastAPI, Neo4j, MCP, three-point bending test) for optional YAML `methods:`.
   Record the **original title** of the source (paper title, article headline, repo name) for `title:` in frontmatter. Determine the **source type** (`paper`, `preprint`, `article`, `blog-post`, `github-repo`, `book`, `video`, `documentation`, or `concept` for synthesized pages) for `type:`.

3. **Create or Update Wiki Pages:**
   For every extracted concept, modify the `wiki/` directory following the schema rules:
   - **If the topic exists:** Update the existing `.md` file. Synthesize the new information without overwriting old knowledge. Flag any contradictions between the new source and existing knowledge.
   - **If the topic does NOT exist:** Create a new `.md` file dedicated to that single concept.
   
   **Page Rules:**
   - Every topic gets its own `.md` file, saved into a relevant subfolder within `wiki/` (e.g., `wiki/Agentic AI/`, `wiki/Building Energy/`).
   - Every wiki file MUST have YAML frontmatter containing:
     - `title:` — the original source title (or wiki page title for `concept` pages)
     - `type:` — one of `paper`, `preprint`, `article`, `blog-post`, `github-repo`, `book`, `video`, `documentation`, `concept`
     - `authors:` — plain text, no `[[ ]]`
     - `tags:` — standard lowercase-dash format
     - `date_added:` — ISO `YYYY-MM-DD` (today's date for this compile run)
     - `url:` — include when a clear primary source URL exists
     - `methods:` — include when the source names specific technologies or techniques worth indexing
   - **Body structure:** After `# Title`, write a **2–4 paragraph extended summary** (~250–300 words) covering what, why, and how. Then add **`## Key Takeaways`** with up to **10** bullets (concrete concepts, results, or implications — not vague restatements of the summary). Add any further sections (e.g. Ecosystem, Integration) with `[[wiki-links]]`.
   - Every wiki file MUST end with a **`## Sources`** section whose entries include at least one **clickable** markdown link per source (primary URL, DOI, or arXiv as available).
   - **Linking philosophy — quality over quantity:** Link pages when the connection is specific and meaningful — when someone reading page A would genuinely benefit from navigating to page B to deepen their understanding of A's content. A well-linked page typically has **2–5 outgoing links** targeting the most conceptually significant relationships. Cross-domain links are valuable when the connection is a core contribution (e.g., an LLM paper whose main novelty is its application to building control should link to both AI and building energy topics). The text inside `[[ ]]` must match the target page's filename (without `.md`); ensure the target page exists in `wiki/` or will be created in this same compile run. If a related concept deserves linking but has no page yet, **create a brief stub page** (frontmatter + 1-paragraph summary) rather than leaving a dangling link or omitting the connection.
   - **Avoid hub pollution:** Do not link to broad umbrella concepts (e.g., "LLM Agents", "Machine Learning") unless the page's content is specifically about that concept's mechanism or a direct, novel application of it. A building control paper that *happens to use* an LLM should not link to a generic LLM Agents page — only link if the LLM agent architecture itself is a core contribution. Hub nodes that everything links to destroy graph structure and make ask-wiki traversal inefficient.
   - **NEVER wiki-link to operational tooling:** Do not wrap this system's own skills, infrastructure, or meta-concepts about the wiki workflow in `[[ ]]` (e.g., never link to "compile-wiki", "lint-wiki", "ask-wiki", "AGENTS.md", or "schema file"). These are operational tooling, not knowledge topics — linking them pollutes the Obsidian graph with non-knowledge nodes. Mention them in plain text if relevant.

   **Link verification (mandatory final step before updating index/log):**
   After writing all pages for the current batch, collect every `[[wiki-link]]` target across all files you created or edited. For each target, verify that a `.md` file with that exact filename exists somewhere in `wiki/`. If any target is missing, either create a stub page for it now or remove the link. Never leave dangling `[[links]]`.

4. **Update the Index and Log:**
   - Update `wiki/index.md` to include any new topics with a one-line description (Do NOT use `[[wiki-links]]` in the index so it doesn't clutter the Obsidian graph).
   - Append a new row to `wiki/log.md` with the Date/Time, File Name, and Key Topics Extracted to mark the file as processed.

## Example
If you process `Energy_Systems.pdf` (a paper titled "Physics-Constrained Neural Networks for HVAC Control" by Jane Doe, DOI: 10.1234/example):
- Determine topics: `building HVAC control` and `physics-constrained neural networks`.
- Create `wiki/Control Systems/building HVAC control.md` with:
  ```yaml
  title: "Physics-Constrained Neural Networks for HVAC Control"
  type: paper
  authors:
    - "Jane Doe"
  tags:
    - building-energy
    - control-systems
  date_added: 2026-04-21
  url: "https://doi.org/10.1234/example"
  methods:
    - physics-constrained neural networks
    - HVAC simulation
  ```
- Ensure the body has the 2–4 paragraph extended summary, `## Key Takeaways` (up to 10 bullets), further sections, and `## Sources` with a clickable DOI link.
- Add 2–5 `[[wiki-links]]` to closely related pages (existing or created in this same run), focusing on the most meaningful conceptual relationships. If a related concept has no page yet, create a stub (frontmatter + 1-paragraph summary) so the link resolves. Avoid linking to broad umbrella topics unless the relationship is a core contribution.
- Update `wiki/index.md` with descriptions for both new pages.
- Log the file in `wiki/log.md`.