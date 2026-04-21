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

3. **Create or Update Wiki Pages:**
   For every extracted concept, modify the `wiki/` directory following the schema rules:
   - **If the topic exists:** Update the existing `.md` file. Synthesize the new information without overwriting old knowledge. Flag any contradictions between the new source and existing knowledge.
   - **If the topic does NOT exist:** Create a new `.md` file dedicated to that single concept.
   
   **Page Rules:**
   - Every topic gets its own `.md` file, saved into a relevant subfolder within `wiki/` (e.g., `wiki/Agentic AI/`, `wiki/Building Energy/`).
   - Every wiki file MUST have YAML frontmatter containing `authors:` (as plain text, no brackets) and `tags:` (using standard lowercase-dash format).
   - Every wiki file MUST start with a one-paragraph summary.
   - Link related topics to each other using `[[topic-name]]` format (Obsidian resolves links automatically regardless of subfolders).

4. **Update the Index and Log:**
   - Update `wiki/index.md` to include any new topics with a one-line description (Do NOT use `[[wiki-links]]` in the index so it doesn't clutter the Obsidian graph).
   - Append a new row to `wiki/log.md` with the Date/Time, File Name, and Key Topics Extracted to mark the file as processed.

## Example
If you process `Energy_Systems.pdf` discussing HVAC control and Neural Networks:
- Create/Update `wiki/Control Systems/building HVAC control.md`
- Create/Update `wiki/Machine Learning/physics-constrained neural networks.md`
- Ensure both files start with a one-paragraph summary.
- Link them: `This approach utilizes [[physics-constrained neural networks]] to enhance [[building HVAC control]].`
- Update `wiki/index.md` with descriptions for both.
- Log the file in `wiki/log.md`.