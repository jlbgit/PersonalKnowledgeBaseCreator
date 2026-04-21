---
name: ask-wiki
description: Query the LLM wiki to generate insights, research briefings, or answer questions. Synthesizes knowledge across the wiki/ folder and saves the outputs to output/ while also updating relevant wiki pages with the new insights.
---

# Ask Knowledge Base Wiki

This skill formalizes the "Question -> Answer -> Save" loop. It instructs the AI to treat the `wiki/` directory (as defined by `AGENTS.md`) as its sole truth and automatically save generated insights so they compound over time.

## Instructions

When the user asks a question, requests a briefing, or asks you to find gaps in the knowledge base using this skill:

0. **Resolve Paths (always do this first):**
   First, check if a `wiki-config.md` exists in the current workspace root
   (this indicates a project-local wiki). If not found, read
   `wiki-config.md` from the same directory as this skill (e.g.,
   `~/.cursor/skills/wiki-config.md`) for the global wiki. The file
   contains four absolute paths labelled **Wiki root**, **Wiki folder**,
   **Raw folder**, and **Output folder**. Use these paths everywhere below
   instead of the relative `wiki/`, `raw/`, and `output/` defaults.
   If neither file exists, fall back to relative paths from the workspace root.

1. **Explore the Knowledge Base (Graph Traversal):**
   - **Start Token-Efficiently:** First, scan `wiki/index.md` to identify the entry-point nodes (topics) directly relevant to the user's query.
   - **Traverse the Knowledge Graph:** Read the entry-point `.md` files in `wiki/` (which may live in thematic subfolders like `wiki/Building Energy/`) and follow their internal `[[wiki-links]]` to navigate to related concepts. Obsidian resolves links regardless of subfolder, so search for the target filename across all subfolders. Follow links instead of blindly searching the entire `wiki/` directory, staying within the cluster relevant to the query (e.g., a query about "Token Optimization" should not touch "HVAC Control" pages). Apply these traversal rules:
     - **Summary-first reading:** When arriving at a new page via a link, read only its first paragraph (the mandatory summary). Decide whether the full page is relevant before reading the rest.
     - **Prioritize by relevance:** When a page has multiple outgoing `[[wiki-links]]`, follow the link whose topic name is most semantically related to the query first. Skip links that clearly diverge from the query's scope.
     - **Track visited pages:** Keep a mental set of pages already read. Never re-read a page you have already visited, even if you encounter a link back to it.
   - **Identify Sources for Deep-Dive:** After the wiki traversal is complete, review the Sources sections of all visited pages and select up to **10** `raw/` files most relevant to the query. Then read those raw files to retrieve full context for the answer. This two-phase approach (cheap wiki scan first, targeted raw reads second) keeps token usage efficient while still grounding answers in primary sources.

2. **Generate the Insight / Answer:**
   Synthesize an answer using the facts contained within the `wiki/` folder and, if necessary, their original sources in `raw/`. Do not hallucinate external knowledge. If the answer cannot be found in your sources, clearly state that the knowledge base lacks information on the topic.

3. **Include References:**
   At the end of every generated answer or briefing, you MUST include a "References" section. This section should list and link to all the original source documents (from the `raw/` folder or cited in the wiki) that were used to compile the answer.

4. **Save to Outputs:**
   Save the full generated response (including the References section) as a new `.md` file inside the `output/` directory (e.g., `output/Briefing - Agentic AI Workflows.md`).

5. **Re-integrate (Compound) the Knowledge:**
   If the generated answer uncovers a new connection, a synthesized insight, or a newly discovered gap, **update the relevant pages** back in the `wiki/` directory.
   - For example, if the user asks you to compare Source A and Source B on a specific topic, and you find a novel insight, add a "Synthesized Insights" section to that topic's `.md` page in `wiki/`.
   - This ensures that every question asked makes the knowledge base permanently smarter for future queries.

6. **Log the Query:**
   Append a row to `wiki/log.md` recording the timestamp, the query asked, and which wiki pages were updated during re-integration (if any). This keeps the log as the single audit trail for all wiki modifications.

## Example Queries
- "What are the three biggest gaps in my understanding of Agentic AI?"
- "Compare what the wiki says about RAG vs LLM Wikis. Where do they disagree?"
- "Write me a 500-word briefing on HVAC control using only what's in this knowledge base."