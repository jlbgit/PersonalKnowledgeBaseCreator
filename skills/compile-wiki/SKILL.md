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

2. **Extract Key Concepts:**
   For each new file, extract the core ideas, processes, abstract concepts, and domains (e.g., "building HVAC control", "token minimization"). Focus the primary organization and `[[wiki-links]]` on topics, but do extract and record the author(s) of the source material as plain text (e.g., to include in YAML frontmatter or a "Sources" section; NEVER wrap authors in `[[ ]]` so they don't become nodes in the graph). Also, generate 1-3 broad categorizing `tags` (e.g., `knowledge-management`, `agentic-ai`, `rag`) to include in the YAML frontmatter.
   Capture **source URLs** from the raw material when available (article link, DOI, arXiv, blog URL) for frontmatter `url:` and for clickable links in `## Sources`. Extract **methods** when relevant: technologies, frameworks, tools, lab or experimental techniques (e.g., FastAPI, Neo4j, MCP, three-point bending test) for optional YAML `methods:`.

3. **Create or Update Wiki Pages:**
   For every extracted concept, modify the `wiki/` directory following the schema rules:
   - **If the topic exists:** Update the existing `.md` file. Synthesize the new information without overwriting old knowledge. Flag any contradictions between the new source and existing knowledge.
   - **If the topic does NOT exist:** Create a new `.md` file dedicated to that single concept.
   
   **Page Rules:**
   - Every topic gets its own `.md` file, saved into a relevant subfolder within `wiki/` (e.g., `wiki/Agentic AI/`, `wiki/Building Energy/`).
   - Every wiki file MUST have YAML frontmatter containing `authors:` (as plain text, no brackets), `tags:` (standard lowercase-dash format), and `date_added:` (ISO `YYYY-MM-DD` — use the date you add or materially update the wiki entry for this compile run). When the source has a clear primary URL, include `url:`; when the source names technologies or methods worth indexing, include optional `methods:` as a plain list (no `[[ ]]` in frontmatter).
   - **Body structure:** After `# Title`, write a **2–4 paragraph extended summary** (~250–300 words) covering what, why, and how. Then add **`## Key Takeaways`** with up to **10** bullets (concrete concepts, results, or implications — not vague restatements of the summary). Add any further sections (e.g. Ecosystem, Integration) with `[[topic-name]]` links.
   - Every wiki file MUST end with a **`## Sources`** section whose entries include at least one **clickable** markdown link per source (primary URL, DOI, or arXiv as available).
   - Link related topics to each other using `[[topic-name]]` format (Obsidian resolves links automatically regardless of subfolders).

4. **Update the Index and Log:**
   - Update `wiki/index.md` to include any new topics with a one-line description (Do NOT use `[[wiki-links]]` in the index so it doesn't clutter the Obsidian graph).
   - Append a new row to `wiki/log.md` with the Date/Time, File Name, and Key Topics Extracted to mark the file as processed.

## Example
If you process `Energy_Systems.pdf` discussing HVAC control and Neural Networks (with a known DOI or URL in the PDF metadata or text):
- Create/Update `wiki/Control Systems/building HVAC control.md` and `wiki/Machine Learning/physics-constrained neural networks.md` with frontmatter including `date_added: YYYY-MM-DD`, `tags`, `authors`, optional `url:`/`methods:` where applicable.
- Ensure both files have the extended summary, **`## Key Takeaways`** (up to 10 bullets), topic sections, and **`## Sources`** with clickable links.
- Link them in prose: e.g. `This approach utilizes [[physics-constrained neural networks]] to enhance [[building HVAC control]].`
- Update `wiki/index.md` with descriptions for both.
- Log the file in `wiki/log.md`.