---
name: lint-wiki
description: Run the monthly health check on the LLM wiki. Flags contradictions, finds unexplained topics, checks claims against raw sources, suggests missing articles, and fixes the graph.
---

# Lint Knowledge Base Wiki

This skill performs the critical self-healing step for the LLM wiki, preventing errors from compounding over time and ensuring the Obsidian graph remains clean.

## Instructions

When the user asks you to run a health check, lint the wiki, or clean up:

0. **Resolve Paths (always do this first):**
   First, check if a `wiki-config.md` exists in the current workspace root
   (this indicates a project-local wiki). If not found, read
   `wiki-config.md` from the same directory as this skill (e.g.,
   `~/.cursor/skills/wiki-config.md`) for the global wiki. The file
   contains four absolute paths labelled **Wiki root**, **Wiki folder**,
   **Raw folder**, and **Output folder**. Use these paths everywhere below
   instead of the relative `wiki/`, `raw/`, and `output/` defaults.
   If neither file exists, fall back to relative paths from the workspace root.

1. **Run the Structural Pre-Scan:**
   Execute `node lint_graph.js` with the shell working directory set to **Wiki root**
   (the path labelled **Wiki root** in wiki-config — the directory that contains
   `lint_graph.js` and a `wiki/` subfolder). This zero-dependency script
   programmatically checks dangling `[[wiki-links]]`, orphan pages, frontmatter
   validity (`authors:`/`tags:`/`date_added:`), index sync, and possible duplicate page names.
   Use its output to focus your manual review on the flagged issues rather than
   reading every file from scratch.

2. **Review the Flagged Pages:**
   For issues flagged by the script (and for checks the script cannot do, like contradictions and claim verification), read the relevant `.md` files across `wiki/` and its thematic subfolders. Exclude `index.md` and `log.md` from topic checks.

3. **Semantic Health Checks (requires reading content):**
   These checks go beyond what the script can detect and require reading page content:
   - **Flag Contradictions:** Identify any contradictions between articles. Compare conflicting statements and note them clearly, or synthesize if there's consensus.
   - **Verify Claims:** Spot any major claims that don't seem to be backed by a source in the `raw/` folder. Flag these as needing citation.
   - **Suggest New Articles:** Based on the gaps in the current knowledge graph, suggest 3 new articles/topics that would fill missing links.

4. **Fix Frontmatter Issues:**
   For any pages flagged by the script, ensure valid YAML frontmatter containing:
   - `authors:` — plain text, never wrapped in `[[ ]]`.
   - `tags:` — at least one tag in lowercase-dash format.
   - `date_added:` — required; ISO 8601 date `YYYY-MM-DD` (when the entry was added to the wiki).
   - **`url:` (manual check):** If a page has a **`## Sources`** section with **exactly one** bullet and the page is clearly sourced from that item (not a pure synthesis of many ideas), it should usually have a `url:` in frontmatter matching the primary link — flag missing `url:` for human review.

5. **Subfolder Hygiene:**
   Flag any topic `.md` files sitting directly in the `wiki/` root that should be organized into a thematic subfolder.

6. **Unprocessed Files Check:**
   Cross-reference the files in `raw/` against `wiki/log.md` to catch any raw files that compile-wiki may have missed. Report them so the user can run compile-wiki to process them.

7. **Graph Maintenance (Obsidian Integrity):**
   Use the script output as the starting point, then:
   - **Merge Redundancies:** If the script flagged possible duplicates, or you find two files covering the same topic (e.g., "Evaluating LLMs" and "LLM Evaluation"), merge them into one, delete the duplicate, and update all links to point to the new file.
   - **Rescue Orphans:** For pages flagged as orphans, add `[[wiki-links]]` to integrate them into the graph.
   - **Fix Unexplained Topics:** For dangling links, create brief stub pages or fix the links.
   - **Index Sync:** For any mismatches between `wiki/index.md` and the actual topic files, add missing entries or remove stale ones.

8. **Log the Pass and Save the Report:**
   - Append a row to `wiki/log.md` detailing the timestamp of the health check and a summary of actions taken (e.g., "Linting Pass: Flagged 1 contradiction, merged 2 redundancies, suggested 3 new topics").
   - Save the full lint report as a `.md` file in the `output/` directory (e.g., `output/Lint Report - YYYY-MM-DD.md`).

## Output
Provide the user with a markdown summary of the health check results, including the 3 suggested new articles, any contradictions/unbacked claims found, frontmatter issues, and unprocessed raw files.